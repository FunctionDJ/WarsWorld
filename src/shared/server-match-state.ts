import type { Player } from "generated/browser";
import type { COPowerState } from "shared/match-logic/co";
import type { Army } from "shared/schemas/army";
import type { COID } from "shared/schemas/co";
import type { PlayerSlot } from "shared/schemas/player-slot";
import type { RO } from "./ww-readonly";

export interface PlayerInMatch {
  type: "player-in-match";
  slot: PlayerSlot;
  hasCurrentTurn: boolean;
  id: Player["id"];
  name: Player["name"];
  readonly coId: RO<COID>;
  status: "alive" | "routed" | "captured";
  funds: number;
  powerMeter: number;
  timesPowerUsed: number;
  army: Army;
  COPowerState: COPowerState;
}

export interface PlayerInSetup {
  type: "player-in-setup";
  slot: PlayerSlot;
  id: Player["id"];
  name: Player["name"];
  ready: boolean;
  coId?: COID;
  army?: Army;
}

export const createNeutralPlayerInMatch: () => PlayerInMatch = () => ({
  type: "player-in-match",
  slot: -1,
  hasCurrentTurn: false,
  id: "Neutral",
  name: "Neutral",
  ready: true,
  coId: { name: "adder", version: "AW2" },
  status: "alive",
  funds: 0,
  powerMeter: 0,
  timesPowerUsed: 0,
  army: "black-hole",
  COPowerState: "no-power",
});
