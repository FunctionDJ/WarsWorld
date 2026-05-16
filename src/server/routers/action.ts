import { getMatchEmitter } from "server/emitter/event-emitter";
import { prisma } from "server/prisma/prisma-client";
import type {
  EmittableEvent,
  MainEventsWithoutSubEvents,
  MainEventWithSubEvents,
  SubEvent,
} from "shared/events";
import {
  validateMainActionAndToEvent,
  validateSubActionAndToEvent,
} from "shared/match-logic/events/action-to-event";
import {
  applyMainEventToMatch,
  applySubEventToMatch,
} from "shared/match-logic/events/apply-event-to-match";
import { mainActionSchema } from "shared/schemas/action";
import type { MatchWrapper } from "shared/wrappers/match";
import { mainEventToEmittables } from "../../shared/match-logic/events/event-to-emittable";
import { updateMoveVision } from "../../shared/match-logic/events/handlers/move/move";
import { fillDiscoveredUnitsAndProperties } from "../../shared/match-logic/events/vision-update";
import { matchBaseProcedure, playerInMatchBaseProcedure, router } from "../trpc/trpc-setup";

const attachSubEvent = (
  mainEventWithoutSubEvent: MainEventsWithoutSubEvents,
  subEvent: SubEvent,
): MainEventWithSubEvents => {
  if (mainEventWithoutSubEvent.type === "move") {
    return {
      ...mainEventWithoutSubEvent,
      subEvent,
    };
  }

  return mainEventWithoutSubEvent;
};

const getIsJoinOrLoad = (
  mainEventWithoutSubEvent: MainEventsWithoutSubEvents,
  match: MatchWrapper,
): boolean => {
  if (mainEventWithoutSubEvent.type !== "move") {
    return false;
  }

  const { path } = mainEventWithoutSubEvent;

  if (match.getUnit(path.at("last"), "dont-throw") === undefined) {
    return false;
  }

  if (path.at("last").isSame(path.at(0))) {
    return false;
  }

  return true;
};

export const actionRouter = router({
  send: playerInMatchBaseProcedure
    .input(mainActionSchema)
    .mutation(async ({ input, ctx: { match } }) => {
      const matchEmitter = getMatchEmitter(input.matchId);

      /**
       * This order must be followed, otherwise some things may not have required information:
       * 1. Move action to event
       * 2. Apply move event to match
       * 3. Sub action to event
       * 4. Sub event to emittable sub events
       * 5. Move event to emittable move events
       * 6. Update move event vision
       * 7. Apply sub event to match and update sub event vision
       * 8. Add new discovered info (vision) to emittable events
       * 9. Emit emittable events
       * 10. Save event
       */

      console.log("Received action:", input);

      /* 1. Move action to event */
      const mainEventWithoutSubEvent = validateMainActionAndToEvent(match, input);

      // if there was a trap or join/load, the default subEvent is "wait" (check must be done before moving the unit)

      const isJoinOrLoad = getIsJoinOrLoad(mainEventWithoutSubEvent, match);

      /* 2. Apply move event to match */
      applyMainEventToMatch(match, mainEventWithoutSubEvent);

      /**
       * TODO important!
       * we must try-catch the subEvent generation and applying
       * and then apply the "wait" subEvent as a fallback.
       * otherwise bugs or invalid moves would cause a desync
       * between server match state and database/client state
       * because we stop about here and don't store/emit.
       */

      let emittableEvents: readonly (EmittableEvent | undefined)[]; // undefined means that team doesn't receive the event

      // having this subEvent variable is shitty code but it's type-safe and good enough for now.
      let subEvent: SubEvent = { type: "wait" };

      if (mainEventWithoutSubEvent.type === "move" && input.type === "move") {
        // second condition is only needed for type-gating input event

        /* 3. Sub action to event */
        const mainEventWithSubEvent: MainEventWithSubEvents = {
          ...mainEventWithoutSubEvent,
          subEvent: {
            type: "wait",
          },
        };

        if (!mainEventWithoutSubEvent.trap && !isJoinOrLoad) {
          mainEventWithSubEvent.subEvent = validateSubActionAndToEvent(match, input);
        }

        /* 4. Sub event to emittable sub events (done inside, first)*/
        /* 5. Move event to emittable move events */
        emittableEvents = mainEventToEmittables(match, mainEventWithSubEvent);

        /* 6. Update move event vision */
        updateMoveVision(match, mainEventWithSubEvent);

        /* 7. Apply sub event to match and update sub event vision */
        applySubEventToMatch(match, mainEventWithSubEvent);
        // eslint-disable-next-line @typescript-eslint/prefer-destructuring
        subEvent = mainEventWithSubEvent.subEvent;
      } else {
        emittableEvents = mainEventToEmittables(match, mainEventWithoutSubEvent);
      }

      /* 8. Update move vision (and add new vision in general to emittable events) */
      fillDiscoveredUnitsAndProperties(match, emittableEvents);

      /* 9. Emit emittable events */
      // TODO @function either this function gets a list of emittables, or we iterate through them here.
      //  undefined means that team shouldn't receive the event
      //  emittableEvents[i] is from match.teams[i]. emittableEvents has one extra "no team"(spectator) at the end

      for (const event of emittableEvents) {
        if (event === undefined) {
          continue;
        }

        await matchEmitter.emit("emittable", {
          ...event,
          teamId: event.teamIndex,
        });
      }

      /* 10. Save event */
      // const eventOnDB = await prisma.event.create({
      await prisma.event.create({
        data: {
          matchId: input.matchId,
          content: attachSubEvent(mainEventWithoutSubEvent, subEvent),
        },
      });

      // [missing-implementation] we still need something like the following to handle timeout eliminations.

      // if (playerEliminatedEvent !== undefined) {
      //   applyMainEventToMatch(match, playerEliminatedEvent);

      //   const eliminationEventOnDB = await prisma.event.create({
      //     data: {
      //       content: playerEliminatedEvent,
      //       matchId: match.id
      //     }
      //   })

      //   const emittableEliminationEvent: EmittableEvent = {
      //     ...playerEliminatedEvent,
      //     matchId: match.id,
      //     index: eliminationEventOnDB.index
      //   }

      //   emit(emittableEliminationEvent)
      // }
    }),
  onEvent: matchBaseProcedure.subscription(async function* ({ input, signal }) {
    // [improvement] https://trpc.io/docs/server/subscriptions#tracked

    // TODO how to subscribe with specific currentPlayer.id ?
    // or filter the events/emittables otherwise for the observing player/viewer?

    const matchEmitter = getMatchEmitter(input.matchId);

    for await (const { data } of matchEmitter.events("emittable", {
      signal,
    })) {
      yield data;
    }
  }),
  // [missing-feature] create procedure for anonymous users to observe games
  // (they get their own special "-1" team or something)
});
