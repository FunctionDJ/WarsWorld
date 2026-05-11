import { globalEmittable } from "server/emitter/event-emitter";
import { prisma } from "server/prisma/prisma-client";
import { createMatchStartEvent } from "shared/match-logic/events/handlers/match-start";
import { MutableMatch } from "shared/wrappers/match/mutable-match";
import { z } from "zod";
import { matchInSetupBaseProcedure } from "../../trpc/trpc-setup";

export const setReady = matchInSetupBaseProcedure
  .input(
    z.object({
      readyState: z.boolean(),
    }),
  )
  .mutation(async ({ input, ctx: { match, currentPlayer: player } }) => {
    const playerBeforeMatch = match.findPlayerById(player.id);
    playerBeforeMatch.ready = input.readyState;

    if (match.getAllPlayers().some((p) => !p.ready)) {
      await prisma.match.update({
        where: { id: match.id },
        data: { playerState: { type: "players-in-setup", players: match.getAllPlayers() } },
      });

      await globalEmittable(match, {
        type: "player-changed-ready-status",
        matchId: match.id,
        playerId: player.id,
        ready: input.readyState,
      });

      return;
    }

    /**
     * TODO
     * - give first player funds, maybe we need to everything that passTurn does?
     * - set up timer
     */
    const playingMatch = new MutableMatch(
      match.id,
      match.leagueType,
      [], // TODO changeableTiles
      match.rules,
      "playing",
      match.map,
      [], // TODO newPlayerState i think
      match.map.predeployedUnits,
      0, // TODO unsure if turn 0 is correct, maybe turn 1?
    );

    const matchStartEvent = createMatchStartEvent(playingMatch);

    await prisma.$transaction(async (tx) => {
      await tx.event.create({
        data: {
          content: matchStartEvent,
          matchId: match.id,
        },
      });

      await tx.match.update({
        where: { id: match.id },
        data: {
          playerState: { type: "players-in-setup", players: match.getAllPlayers() },
          status: "playing",
        },
      });
    });

    await globalEmittable(match, {
      ...matchStartEvent,
      teamIndex: 0, // TODO idk if this is correct
    });
  });
