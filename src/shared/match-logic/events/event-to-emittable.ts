import { Path } from "shared/schemas/path";
import type { WWReadOnly } from "shared/types/ww-readonly";
import type { Position } from "../../schemas/position";
import type {
  EmittableEvent,
  EmittableSubEvent,
  MainEventsWithoutSubEvents,
  MainEventWithSubEvents,
  MoveEventWithoutSubEvent,
  MoveEventWithSubEvent,
} from "../../types/events";
import type { MatchWrapper } from "../../wrappers/match/match";
import { Team } from "../../wrappers/team/team";
import { createEmittableAttackEvent } from "./handlers/attack/attack-event-to-emittable";

type EmittableSubEventWithExtraInfo = Readonly<{
  teamIndex: number;
  subEvent: EmittableSubEvent;
  requireLastMovePosition: boolean;
}>;

const subEventToEmittables = (
  match: MatchWrapper,
  moveEvent: MoveEventWithSubEvent | MoveEventWithoutSubEvent,
): EmittableSubEventWithExtraInfo[] => {
  const spectatorTeam = new Team([], match, -1);
  const teamsWithSpectator = [...match.teams, spectatorTeam];

  if (!("subEvent" in moveEvent)) {
    return teamsWithSpectator.map((team) => ({
      teamIndex: team.index,
      subEvent: { type: "wait" },
      requireLastMovePosition: false,
    }));
  }

  const { subEvent, path } = moveEvent;
  const fromPosition = path.at("last");

  // requireLastMovePosition is responsible for letting move event know if last position is
  // required for the sub-event to work

  switch (subEvent.type) {
    case "attack": {
      const attacker = match.getUnit(fromPosition);

      //TODO why is this here?
      switch (subEvent.eliminationReason) {
        case "all-attacker-units-destroyed": {
          attacker.player.data.status = "routed";
          break;
        }
        case "all-defender-units-destroyed": {
          const defender = match.getUnit(subEvent.defenderPosition);
          defender.player.data.status = "routed";
          break;
        }
      }

      return teamsWithSpectator.map((team) => ({
        teamIndex: team.index,
        subEvent: createEmittableAttackEvent(match, attacker, subEvent, team),
        requireLastMovePosition: false,
      }));
    }
    case "ability": {
      return teamsWithSpectator.map((team) => {
        if (team.isPositionVisible(fromPosition)) {
          return {
            teamIndex: team.index,
            subEvent,
            requireLastMovePosition: false,
          };
        } else if (
          match.getUnit(fromPosition).data.type === "apc" &&
          (team.isPositionVisible(fromPosition.addDirection("up")) ||
            team.isPositionVisible(fromPosition.addDirection("down")) ||
            team.isPositionVisible(fromPosition.addDirection("left")) ||
            team.isPositionVisible(fromPosition.addDirection("right")))
        ) {
          // that means that at least one supplied unit by apc is visible, so we kinda need to "reveal"
          // the apc location to play the refuel animation (we can later give less information, but it
          // would need a lot more work)
          return {
            teamIndex: team.index,
            subEvent,
            requireLastMovePosition: true,
          };
        } else if (subEvent.eliminationReason !== undefined) {
          // if it's an hp / lab capture, we have to send the event to everyone,
          // and send the last position as well to reveal which team captured it
          return {
            teamIndex: team.index,
            subEvent,
            requireLastMovePosition: true,
          };
        } else {
          return {
            teamIndex: team.index,
            subEvent: { type: "wait" },
            requireLastMovePosition: false,
          };
        }
      });
    }
    case "unloadWait": {
      return teamsWithSpectator.map((team) => ({
        teamIndex: team.index,
        subEvent,
        unloads: subEvent.unloads.filter((unload) =>
          team.isPositionVisible(fromPosition.addDirection(unload.direction)),
        ),
        requireLastMovePosition: team.isPositionVisible(fromPosition),
      }));
    }
    case "repair": {
      return teamsWithSpectator.map((team) => ({
        teamIndex: team.index,
        subEvent: team.isPositionVisible(fromPosition) ? subEvent : { type: "wait" },
        requireLastMovePosition: false,
      }));
    }
    case "launchMissile": {
      // missile is visible for spectators in fog of war as well
      // it requires position to update the missile silo tile
      return teamsWithSpectator.map((team) => ({
        teamIndex: team.index,
        subEvent,
        requireLastMovePosition: true,
      }));
    }
    case "wait": {
      return teamsWithSpectator.map((team) => ({
        teamIndex: team.index,
        subEvent,
        requireLastMovePosition: false,
      }));
    }
  }
};

export const mainEventToEmittables = (
  match: MatchWrapper,
  event: MainEventsWithoutSubEvents | MainEventWithSubEvents,
): (EmittableEvent | undefined)[] => {
  const spectatorTeam = new Team([], match, -1);
  const teamsWithSpectator: WWReadOnly<Team[]> = [...match.teams, spectatorTeam];

  switch (event.type) {
    case "move": {
      // the move has already been applied to match !
      const emittableSubEvents = subEventToEmittables(match, {
        subEvent: { type: "wait" }, // fill a wait subEvent if move doesn't have a subEvent
        ...event,
      });

      const unit = match.getUnit(event.path.at("last"));

      return teamsWithSpectator.map((team) => {
        // special visible function for hidden subs and stealth
        const isPositionVisible =
          "hidden" in unit.data && unit.data.hidden
            ? (position?: Position): position is Position => {
                if (position === undefined) {
                  return false;
                }

                for (const pos of position.getNeighbours()) {
                  if (match.getUnit(pos, "dont-throw")?.player.team.index === team.index) {
                    return true;
                  }
                }

                return false;
              }
            : (position?: Position): position is Position =>
                position === undefined ? false : team.isPositionVisible(position);

        let shownPath = new Path([]);

        const emittableSubEvent = emittableSubEvents.find((s) => s.teamIndex === team.index)!;

        if (event.path.len() === 1) {
          const first = event.path.at(0);

          if (emittableSubEvent.requireLastMovePosition || isPositionVisible(first)) {
            shownPath = shownPath.with(first);
          }
        } else {
          if (isPositionVisible(event.path.at(0)) || isPositionVisible(event.path.at(1))) {
            shownPath = shownPath.with(event.path.at(0));
          }

          for (let pInd = 1; pInd < event.path.len() - 1; ++pInd) {
            if (
              isPositionVisible(event.path.at(pInd - 1)) ||
              isPositionVisible(event.path.at(pInd)) ||
              isPositionVisible(event.path.at(pInd + 1))
            ) {
              shownPath = shownPath.with(event.path.at(pInd));
            }
          }

          if (
            isPositionVisible(event.path.at("last")) ||
            isPositionVisible(event.path.at(-2)) ||
            emittableSubEvent.requireLastMovePosition
          ) {
            shownPath = shownPath.with(event.path.at("last"));
          }
        }

        // right now appearing units have all data, but if they go from fog to fog,
        // they may have only unit type (and other stats not visible)
        const result: EmittableEvent = {
          teamIndex: team.index,
          type: "move",
          path: shownPath,
          fundsGained:
            !match.rules.fogOfWar || unit.player.team === team ? event.fundsGained : undefined,
          trap: team.isPositionVisible(event.path.at("last")) ? event.trap : false,
          subEvent: emittableSubEvent.subEvent,
          //if unit shows and it was not visible before
          appearingUnit:
            shownPath.len() == 0 || team.isPositionVisible(event.path.at(0))
              ? undefined
              : match.getUnit(event.path.at("last")).data,
        };

        return result;
      });
    }
    case "unloadNoWait": {
      return teamsWithSpectator.map((team) => {
        // if either the transport or the unloaded unit is visible, send the event
        if (
          team.isPositionVisible(event.transportPosition) ||
          team.isPositionVisible(event.transportPosition.addDirection(event.unloads.direction))
        ) {
          return {
            ...event,
            teamIndex: team.index,
          };
        } else {
          return;
        }
      });
    }
    case "build": {
      // NOTE: THIS IS JUST FOR TESTING
      // I suspect that Fog Of War will stop certain players from receiving these events and thus
      // this switch case will have a different implementation.
      return teamsWithSpectator.map((team) => ({
        ...event,
        teamIndex: team.index,
      }));
    }
    case "delete": {
      return teamsWithSpectator.map((team) => {
        // slight inaccuracy: we send the delete position that causes the player to lose
        if (team.isPositionVisible(event.position) || event.eliminationReason !== undefined) {
          return {
            ...event,
            teamIndex: team.index,
          };
        } else {
          return;
        }
      });
    }
    default: {
      return teamsWithSpectator.map((team) => ({
        ...event,
        teamIndex: team.index,
      }));
    }
  }
};
