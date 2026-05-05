import { arr } from "shared/arr";
import { PathWrapper, PositionWrapper } from "../../schemas/position";
import type {
  EmittableEvent,
  EmittableSubEvent,
  MainEventsWithoutSubEvents,
  MainEventWithSubEvents,
  MoveEventWithoutSubEvent,
  MoveEventWithSubEvent,
} from "../../types/events";
import type { MatchWrapper } from "../../wrappers/match";
import { TeamWrapper } from "../../wrappers/team";
import { createEmittableAttackEvent } from "./handlers/attack/attackEventToEmittable";

interface EmittableSubEventWithExtraInfo {
  teamIndex: number;
  subEvent: EmittableSubEvent;
  requireLastMovePosition: boolean;
}

const subEventToEmittables = (
  match: MatchWrapper,
  moveEvent: MoveEventWithSubEvent | MoveEventWithoutSubEvent,
): EmittableSubEventWithExtraInfo[] => {
  const spectatorTeam = new TeamWrapper([], match, -1);
  const teamsWithSpectator = [...match.teams, spectatorTeam];

  if (!("subEvent" in moveEvent)) {
    return teamsWithSpectator.map((team) => ({
      teamIndex: team.index,
      subEvent: { type: "wait" },
      requireLastMovePosition: false,
    }));
  }

  const { subEvent, path } = moveEvent;
  const fromPosition = path.get("last");

  // requireLastMovePosition is responsible for letting move event know if last position is
  // required for the sub-event to work

  switch (subEvent.type) {
    case "attack": {
      const attacker = match.getUnitOrThrow(fromPosition);

      //TODO why is this here?
      switch (subEvent.eliminationReason) {
        case "all-attacker-units-destroyed": {
          attacker.player.data.status = "routed";
          break;
        }
        case "all-defender-units-destroyed": {
          const defender = match.getUnitOrThrow(subEvent.defenderPosition);
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
          match.getUnitOrThrow(fromPosition).data.type === "apc" &&
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
  const spectatorTeam = new TeamWrapper([], match, -1);
  const teamsWithSpectator = [...match.teams, spectatorTeam];

  switch (event.type) {
    case "move": {
      // the move has already been applied to match !
      const emittableSubEvents = subEventToEmittables(match, {
        subEvent: { type: "wait" }, // fill a wait subEvent if move doesn't have a subEvent
        ...event,
      });

      const unit = match.getUnitOrThrow(event.path.get("last"));

      return teamsWithSpectator.map((team) => {
        // special visible function for hidden subs and stealth
        const isPositionVisible =
          "hidden" in unit.data && unit.data.hidden
            ? (position: PositionWrapper | undefined): position is PositionWrapper => {
                if (position === undefined) {
                  return false;
                }

                for (const pos of position.getNeighbours()) {
                  if (match.getUnit(pos)?.player.team.index === team.index) {
                    return true;
                  }
                }

                return false;
              }
            : (position: PositionWrapper | undefined): position is PositionWrapper =>
                position === undefined ? false : team.isPositionVisible(position);

        const shownPath = new PathWrapper([]);

        const emittableSubEvent = emittableSubEvents.find((s) => s.teamIndex === team.index)!;

        if (event.path.data.length === 1) {
          const first = arr(event.path.data, 0);

          if (emittableSubEvent.requireLastMovePosition || isPositionVisible(first)) {
            shownPath.data.push(first);
          }
        } else {
          if (
            isPositionVisible(arr(event.path.data, 0)) ||
            isPositionVisible(arr(event.path.data, 1))
          ) {
            shownPath.data.push(arr(event.path.data, 0));
          }

          for (let pInd = 1; pInd < event.path.data.length - 1; ++pInd) {
            if (
              isPositionVisible(event.path.data[pInd - 1]) ||
              isPositionVisible(event.path.data[pInd]) ||
              isPositionVisible(event.path.data[pInd + 1])
            ) {
              shownPath.data.push(arr(event.path.data, 0));
            }
          }

          if (
            isPositionVisible(event.path.data.at(-1)) ||
            isPositionVisible(event.path.data.at(-2)) ||
            emittableSubEvent.requireLastMovePosition
          ) {
            shownPath.data.push(event.path.get("last"));
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
          trap: team.isPositionVisible(event.path.data.at(-1)) ? event.trap : false,
          subEvent: emittableSubEvent.subEvent,
          //if unit shows and it was not visible before
          appearingUnit:
            shownPath.data.length == 0 || team.isPositionVisible(event.path.data[0])
              ? undefined
              : match.getUnitOrThrow(event.path.get("last")).data,
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
          return undefined;
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
          return undefined;
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
