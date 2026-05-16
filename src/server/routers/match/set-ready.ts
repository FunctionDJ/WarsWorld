import { globalEmittable } from "server/emitter/event-emitter";
import { prisma } from "server/prisma/prisma-client";
import { createMatchStartEvent } from "shared/match-logic/events/handlers/match-start";
import { MatchWrapper } from "shared/wrappers/match";
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

    // TODO i think we might not want to do this.
    // we don't have any check for if the match is even "playable" (e.g. this code would start the match when there's 1 player and they click ready)
    // maybe we'll just split the "start match" logic into a separate procedure that can only be called by the host
    // which would have "playability" logic.

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
    const playingMatch = new MatchWrapper(
      match.id,
      match.rules,
      match.map,
      [], // TODO newPlayerState i think
      match.map.predeployedUnits,
    );

    playingMatch.leagueType = match.leagueType;
    // playingMatch.changeableTiles = getchangeableTilesForMatch(match.map.changeableTiles); // needed?

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
