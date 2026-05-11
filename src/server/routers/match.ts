import { TRPCError } from "@trpc/server";
import { pageMatchIndex } from "server/page-match-index";
import { playerMatchIndex } from "server/player-match-index";
import { mapReadOnly } from "shared/array-utilities";
import { positionSchema } from "shared/schemas/position";
import { z } from "zod";
import {
  matchBaseProcedure,
  playerBaseProcedure,
  publicBaseProcedure,
  router,
} from "../trpc/trpc-setup";
import { createMatchProcedure } from "./match/create";
import { joinMatch } from "./match/join";
import { leaveMatch } from "./match/leave";
import { setReady } from "./match/set-ready";
import { switchOptions } from "./match/switch-options";
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
  join: joinMatch,
  leave: leaveMatch,
  setReady: setReady,
  switchOptions,
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
