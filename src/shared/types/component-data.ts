import type { Match, WWMap } from "generated/browser";
import type { MatchStatus } from "generated/enums";
import type { PlayerInMatch } from "./server-match-state";

export interface FrontendMatch {
  id: Match["id"];
  map: MapBasic;
  players: PlayerInMatch[];
  state: MatchStatus;
  turn: number;
}

export type MapBasic = Pick<WWMap, "id" | "name" | "numberOfPlayers">;
