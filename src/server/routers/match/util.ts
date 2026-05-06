import { TRPCError } from "@trpc/server";
import type { PlayerInMatch } from "shared/types/server-match-state";
import type { MapWrapper } from "shared/wrappers/map";
import type { MatchWrapper } from "shared/wrappers/match";

export const throwIfMatchNotInSetupState = (match: MatchWrapper): void => {
  if (match.status !== "setup") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This action requires the match to be in 'setup' state, but it isn't",
    });
  }
};

const mapToFrontend = (map: MapWrapper): { id: string; name: string; numberOfPlayers: number } => ({
  id: map.data.id,
  name: map.data.name,
  numberOfPlayers: map.data.numberOfPlayers,
});

export const matchToFrontend = (
  match: MatchWrapper,
): {
  id: string;
  map: ReturnType<typeof mapToFrontend>;
  players: PlayerInMatch[];
  state: string;
  turn: number;
} => ({
  id: match.id,
  map: mapToFrontend(match.map),
  players: match.getAllPlayers().map((player) => player.data),
  state: match.status,
  turn: match.turn,
});

export function allMatchSlotsReady(match: MatchWrapper): boolean {
  for (let i = 0; i < match.map.data.numberOfPlayers; i++) {
    if (match.getPlayerBySlot(i)?.data.ready !== true) {
      return false;
    }
  }

  return true;
}

export function getNextAvailableSlot(match: MatchWrapper): number {
  for (let i = 0; i < match.map.data.numberOfPlayers; i++) {
    if (match.getPlayerBySlot(i) === undefined) {
      return i;
    }
  }

  throw new Error("No player slots available (game full)");
}
