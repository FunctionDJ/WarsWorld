import { TRPCError } from "@trpc/server";
import type Emittery from "emittery";
import type { Match } from "generated/browser";
import type { Emittable } from "shared/events";
import type { MatchWrapper } from "shared/wrappers/match";
import type { MatchInSetup } from "shared/wrappers/match-in-setup";

type WWEmittery = Emittery<{ emittable: Emittable & { teamId: number } }>;

export const emitterMap = new Map<Match["id"], WWEmittery>();

export const getMatchEmitter = (matchId: Match["id"]): WWEmittery => {
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
export const globalEmittable = async (
  match: MatchWrapper | MatchInSetup,
  emittable: Emittable,
): Promise<void> => {
  const matchEmitter = getMatchEmitter(match.id);

  const teams = match.type === "match-in-setup" ? match.getTeams() : match.teams;

  await Promise.all(
    teams.map((team) =>
      matchEmitter.emit("emittable", {
        ...emittable,
        teamId: team.index,
      }),
    ),
  );
};
