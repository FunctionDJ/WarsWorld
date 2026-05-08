import type { WWMap } from "generated/browser";
import type { PlayerBeforeMatch, PlayerInMatch } from "shared/types/server-match-state";
import type { WWReadOnly } from "shared/types/ww-readonly";
import type { MapWrapper } from "shared/wrappers/map";
import type { MatchWrapper } from "shared/wrappers/match/match";
import type { MatchInSetup } from "shared/wrappers/match/match-in-setup";

const mapToFrontend = (
  map: MapWrapper | WWReadOnly<WWMap>,
): { id: string; name: string; numberOfPlayers: number } => {
  if ("data" in map) {
    return {
      id: map.data.id,
      name: map.data.name,
      numberOfPlayers: map.data.numberOfPlayers,
    };
  }

  return {
    id: map.id,
    name: map.name,
    numberOfPlayers: map.numberOfPlayers,
  };
};

export const matchToFrontend = (
  match: MatchWrapper | MatchInSetup,
): {
  id: string;
  map: ReturnType<typeof mapToFrontend>;
  players: PlayerInMatch[] | PlayerBeforeMatch[];
  state: string;
  turn: number;
} => {
  const players =
    match.type === "match-in-setup"
      ? match.players
      : match.getAllPlayers().map((player) => player.data);
  const turn = match.type === "match-in-setup" ? 0 : match.turn;

  return {
    id: match.id,
    map: mapToFrontend(match.map),
    players,
    state: match.state,
    turn,
  };
};

export function getNextAvailableSlot(match: MatchWrapper): number {
  for (let index = 0; index < match.map.data.numberOfPlayers; index++) {
    if (match.getPlayerBySlot(index) === undefined) {
      return index;
    }
  }

  throw new Error("No player slots available (game full)");
}
