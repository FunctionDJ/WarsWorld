import { globalEmittable } from "server/emitter/event-emitter";
import { playerMatchIndex } from "server/player-match-index";
import { prisma } from "server/prisma/prisma-client";
import { DispatchableError } from "shared/dispatchable-error";
import { armyList } from "shared/schemas/army";
import { coIdSchema } from "shared/schemas/co";
import { z } from "zod";
import type { PlayerBeforeMatch } from "../../../shared/types/server-match-state";
import { matchInSetupBaseProcedure } from "../../trpc/trpc-setup";

export const joinMatch = matchInSetupBaseProcedure
  .input(
    z.object({
      selectedCO: coIdSchema,
      playerSlot: z.number().int().nonnegative(),
      teamIndex: z.number().int().nonnegative(),
    }),
  )
  .mutation(async ({ input, ctx: { currentPlayer, match } }) => {
    if (match.getAllPlayers().some((p) => p.id === currentPlayer.id)) {
      throw new DispatchableError("You've already joined this match!");
    }

    if (match.getAllPlayers().length <= input.playerSlot) {
      throw new DispatchableError("Invalid player slot given");
    }

    if (match.getAllPlayers().some((p) => p.slot === input.playerSlot)) {
      throw new DispatchableError("Player slot is occupied");
    }

    //TODO check if selectedCO is allowed for tier/league/match-blacklist
    // (do players join a match with a CO pick already done or join then choose?)
    // this might not be necessary to do here but on switchCO

    const armiesOccupied = new Set(match.getAllPlayers().map((player) => player.army));
    const availableArmies = armyList.filter((army) => !armiesOccupied.has(army));

    const player: PlayerBeforeMatch = {
      id: currentPlayer.id,
      slot: input.playerSlot,
      ready: false,
      coId: input.selectedCO,
      name: currentPlayer.name,
      army: availableArmies[Math.trunc(Math.random() * availableArmies.length)],
    };

    match.addPlayer(player, input.teamIndex);
    playerMatchIndex.onPlayerJoin(player, match);

    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: match.id },
        data: { playerState: { type: "players-in-setup", players: match.getAllPlayers() } },
      });

      await tx.player.update({
        where: { id: player.id },
        data: { matches: { connect: { id: match.id } } },
      });
    });

    await globalEmittable(match, {
      type: "player-joined",
      matchId: match.id,
      playerId: player.id,
    });
  });
