import { TRPCError } from "@trpc/server";
import { globalEmittable } from "server/emitter/event-emitter";
import { matchStore } from "server/match-store";
import { pageMatchIndex } from "server/page-match-index";
import { playerMatchIndex } from "server/player-match-index";
import { prisma } from "server/prisma/prisma-client";
import { arrayAtOrThrow, mapReadOnly } from "shared/array-utilities";
import { DispatchableError } from "shared/dispatchable-error";
import { createMatchStartEvent } from "shared/match-logic/events/handlers/match-start";
import { armyList, armySchema } from "shared/schemas/army";
import { coIdSchema } from "shared/schemas/co";
import { playerSlotForUnitsSchema } from "shared/schemas/player-slot";
import { positionSchema } from "shared/schemas/position";
import { safeRemoveFromArray } from "shared/types/throw-helper";
import { MutableMatch } from "shared/wrappers/match/mutable-match";
import { z } from "zod";
import type { PlayerBeforeMatch, PlayerInMatch } from "../../shared/types/server-match-state";
import {
  matchBaseProcedure,
  matchInSetupBaseProcedure,
  playerBaseProcedure,
  publicBaseProcedure,
  router,
} from "../trpc/trpc-setup";
import { createMatchProcedure } from "./match/create";
import { matchToFrontend } from "./match/utility";

export const matchRouter = router({
  create: createMatchProcedure,

  getAll: publicBaseProcedure
    .input(z.object({ pageNumber: z.number().int().nonnegative() }))
    .query(({ input: { pageNumber } }) =>
      pageMatchIndex.getPage(pageNumber).map((element) => matchToFrontend(element)),
    ),

  getPlayerMatches: playerBaseProcedure.query(
    ({ ctx: { currentPlayer } }) =>
      playerMatchIndex
        .getPlayerMatches(currentPlayer.id)
        ?.map((element) => matchToFrontend(element)) ?? [],
  ),
  full: matchBaseProcedure.query(
    ({ ctx: { match } }) =>
      ({
        id: match.id,
        leagueType: match.leagueType,
        changeableTiles: match.changeableTiles,
        currentWeather: match.getCurrentWeather(),
        map: match.map.data,
        players: mapReadOnly(match.getAllPlayers(), (player) => player.data),
        rules: match.rules,
        state: match.state,
        turn: match.turn,
        units: mapReadOnly(match.units, (u) => u.data),
        // match.getPlayerById(currentPlayer.id)?.team.getEnemyUnitsInVision() ?? []
      }) as const,
  ),
  join: matchInSetupBaseProcedure
    .input(
      z.object({
        selectedCO: coIdSchema,
        playerSlot: z.number().int().nonnegative().optional(),
      }),
    )
    .mutation(async ({ input, ctx: { currentPlayer, match } }) => {
      if (match.players.some((p) => p.id === currentPlayer.id)) {
        throw new DispatchableError("You've already joined this match!");
      }

      if (input.playerSlot !== undefined && match.players.length <= input.playerSlot) {
        throw new DispatchableError("Invalid player slot given");
      }

      if (
        input.playerSlot !== undefined &&
        match.players.some((p) => p.slot === input.playerSlot)
      ) {
        throw new DispatchableError("Player slot is occupied");
      }

      //TODO check if selectedCO is allowed for tier/league/match-blacklist
      // (do players join a match with a CO pick already done or join then choose?)
      // this might not be necessary to do here but on switchCO

      // When there is not a specified slot to join, loop from 0 until an open slot is found
      let slotToJoin = 0;

      while (match.players.some((p) => p.slot === slotToJoin)) {
        slotToJoin += 1;
      }

      // There should be code earlier in this flow that prevents this if statement from being true.
      if (match.players.length <= slotToJoin) {
        throw new DispatchableError("Match is full");
      }

      const armiesOccupied = new Set(match.players.map((player) => player.army));

      const availableArmies = armyList.filter((army) => !armiesOccupied.has(army));

      const player: PlayerBeforeMatch = {
        id: currentPlayer.id,
        slot: input.playerSlot ?? slotToJoin,
        ready: false,
        coId: input.selectedCO,
        name: currentPlayer.name,
        army: availableArmies[Math.trunc(Math.random() * availableArmies.length)],
      };

      match.players.push(player);
      playerMatchIndex.onPlayerJoin(player, match);
      //TODO: Player is already on the team

      //lets create a playerState (what the db holds) to send it to the db.
      // playerState is basically a PlayerInMatchWrapper[] (well, at least the properties of it)

      const newPlayerState = match.players.map((p) => (p.id === player.id ? player : p));

      await prisma.$transaction(async (tx) => {
        //TODO: Have to add player to match.Player[]
        await tx.match.update({
          where: { id: match.id },
          data: { playerState: newPlayerState /*Player: [player] */ },
        });

        //TODO: Have to add match to the players matches[]

        /*    await tx.player.update({
              where: { id: playerId },
              data: { matches: [findMatch] },
            })*/
      });

      await globalEmittable(match, {
        type: "player-joined",
        matchId: match.id,
        playerId: player.id,
      });
    }),
  leave: matchInSetupBaseProcedure.mutation(async ({ ctx: { match, currentPlayer: player } }) => {
    const { team: teamToRemoveFrom } = player;

    safeRemoveFromArray(
      teamToRemoveFrom.players,
      (teamPlayer) => teamPlayer.data.slot === player.slot,
    );

    if (teamToRemoveFrom.players.length === 0) {
      safeRemoveFromArray(match.teams, (team) => team.index === teamToRemoveFrom.index);
    }

    playerMatchIndex.onPlayerLeave(player);

    //There is only one player so, we can remove the whole match
    if (match.teams.length === 1 && arrayAtOrThrow(match.teams, 0).players.length === 1) {
      pageMatchIndex.removeMatch(match);
      matchStore.removeMatchFromIndex(match);
      await prisma.match.delete({ where: { id: match.id } });
    } else {
      const newPlayerState = match.players.filter((p) => p.id !== player.id);
      await prisma.match.update({ where: { id: match.id }, data: { playerState: newPlayerState } });
      safeRemoveFromArray(match.teams, (team) => team.index === player.team.index);

      await globalEmittable(match, {
        type: "player-left",
        matchId: match.id,
        playerId: player.id,
      });
    }
  }),
  setReady: matchInSetupBaseProcedure
    .input(
      z.object({
        readyState: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx: { match, currentPlayer: player } }) => {
      const newPlayerData: PlayerBeforeMatch = {
        ...player,
        ready: input.readyState,
      };

      //lets create a playerState (what the db holds) to send it to the db.
      // playerState is basically a PlayerInMatchWrapper[] (well, at least the properties of it)
      const newPlayerState = match.teams.flatMap((team) =>
        team.players.map((teamPlayer) =>
          teamPlayer.data.id === player.data.id ? newPlayerData : teamPlayer.data,
        ),
      );

      if (match.players.every((p) => p.ready)) {
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
          0, // unsure if turn 0 is correct, maybe turn 1?
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
            data: { playerState: newPlayerState, status: "playing" },
          });
        });

        await globalEmittable(match, {
          ...matchStartEvent,
          teamIndex: 0, // TODO idk if this is correct
        });
      } else {
        await prisma.match.update({
          where: { id: match.id },
          data: { playerState: newPlayerState },
        });

        await globalEmittable(match, {
          type: "player-changed-ready-status",
          matchId: match.id,
          playerId: player.id,
          ready: input.readyState,
        });
      }
    }),
  switchOptions: matchInSetupBaseProcedure
    .input(
      z.object({
        selectedCO: coIdSchema.optional(),
        selectedArmy: armySchema.optional(),
        selectedSlot: playerSlotForUnitsSchema.optional(),
      }),
    )
    .mutation(async ({ input, ctx: { match, currentPlayer: player } }) => {
      const newPlayerData: PlayerInMatch = { ...player.data };
      newPlayerData.coId = input.selectedCO ?? newPlayerData.coId;
      newPlayerData.army = input.selectedArmy ?? newPlayerData.army;
      newPlayerData.slot = input.selectedSlot ?? newPlayerData.slot;

      const armiesOccupied = match.players.map((player) => player.army);
      const slotsOccupied = match.players.map((player) => player.slot);

      // ERROR CHECKING
      // make sures that the ARMY picked by the player is different from all other players
      if (input.selectedArmy !== undefined && armiesOccupied.includes(input.selectedArmy)) {
        throw new DispatchableError("Army is already picked by another player");
      }

      // make sures that the SLOT picked by the player is different from all other players
      if (input.selectedSlot !== undefined && slotsOccupied.includes(input.selectedSlot)) {
        throw new DispatchableError("Slot is already picked by another player");
      }

      // UPDATING STATE
      //lets create a playerState (what the db holds) to send it to the db.
      const newPlayerState = match.teams.flatMap((team) =>
        team.players.map((teamPlayer) =>
          teamPlayer.data.id === player.data.id ? newPlayerData : teamPlayer.data,
        ),
      );

      //lets update prisma first, if the database updates, then we update memory
      await prisma.match.update({ where: { id: match.id }, data: { playerState: newPlayerState } });
      player.coId = newPlayerData.coId;
      player.army = newPlayerData.army;
      player.slot = newPlayerData.slot;

      if (input.selectedCO !== undefined) {
        await globalEmittable(match, {
          type: "player-picked-co",
          coId: input.selectedCO,
          matchId: match.id,
          playerId: player.id,
        });
      }

      if (input.selectedArmy !== undefined) {
        await globalEmittable(match, {
          type: "player-picked-army",
          army: input.selectedArmy,
          matchId: match.id,
          playerId: player.id,
        });
      }

      if (input.selectedSlot !== undefined) {
        await globalEmittable(match, {
          type: "player-picked-slot",
          slot: input.selectedSlot,
          matchId: match.id,
          playerId: player.id,
        });
      }
    }),
  adminUnwaitUnit: matchBaseProcedure
    .input(z.object({ position: positionSchema }))
    .mutation(({ input, ctx }) => {
      // TODO if ctx.user doesn't have the permissions to do this (e.g. isn't an admin)
      // then throw a tRPC error for unauthorized

      const unit = ctx.match.getUnit(input.position);

      if (unit.data.isReady) {
        throw new TRPCError({
          message: "Unit is already ready (unwaited)",
          code: "BAD_REQUEST",
        });
      }

      unit.data.isReady = true;
    }),
});
