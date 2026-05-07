import type { PlayerInMatch } from "shared/types/server-match-state";
import type { MapWrapper } from "shared/wrappers/map";
import type { MatchWrapper } from "shared/wrappers/match/match";

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
  state: match.state,
  turn: match.turn,
});

export function getNextAvailableSlot(match: MatchWrapper): number {
  for (let index = 0; index < match.map.data.numberOfPlayers; index++) {
    if (match.getPlayerBySlot(index) === undefined) {
      return index;
    }
  }

  throw new Error("No player slots available (game full)");
}
