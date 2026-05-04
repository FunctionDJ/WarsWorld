import { TRPCError } from "@trpc/server";
import Emittery from "emittery";
import type { Match } from "generated/browser";
import type { Emittable } from "shared/types/events";
import type { MatchWrapper } from "shared/wrappers/match";

export const emitterMap = new Map<
  Match["id"],
  Emittery<{ emittable: Emittable & { teamId: number } }>
>();

export const getMatchEmitter = (matchId: Match["id"]) => {
  const matchEmitter = emitterMap.get(matchId);

  if (matchEmitter === undefined) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `No emitter found for match with id ${matchId}`,
    });
  }

  return matchEmitter;
};

/**
 * for emittables like "player-join" which always get sent to all teams
 * without team-specific modifications.
 */
export const globalEmittable = async (match: MatchWrapper, emittable: Emittable) => {
  const matchEmitter = getMatchEmitter(match.id);

  await Promise.all(
    match.teams.map((team) =>
      matchEmitter.emit("emittable", {
        ...emittable,
        teamId: team.index,
      }),
    ),
  );
};
