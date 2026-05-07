import type { Player } from "generated/browser";
import type { COPowerState } from "shared/match-logic/co";
import type { Army } from "shared/schemas/army";
import type { COID } from "shared/schemas/co";
import type { PlayerSlot } from "shared/schemas/player-slot";
import type { Position } from "shared/schemas/position";
import type { PipeSeamTile, PropertyTileType, UnusedSiloTileType } from "shared/schemas/tile";

export interface CapturableTile {
  type: PropertyTileType;
  playerSlot: PlayerSlot;
  position: Position;
  // capture points are stored in unit
}

interface LaunchableSiloTile {
  type: UnusedSiloTileType;
  fired: boolean;
  position: Position;
}

export type ChangeableTile =
  | CapturableTile
  | LaunchableSiloTile
  | (PipeSeamTile & { position: Position });

export interface PlayerInMatch {
  slot: PlayerSlot;
  hasCurrentTurn: boolean;
  id: Player["id"];
  name: Player["name"];
  coId: COID;
  status: "alive" | "routed" | "captured";
  funds: number;
  powerMeter: number;
  timesPowerUsed: number;
  army: Army;
  COPowerState: COPowerState;
}

export interface PlayerBeforeMatch {
  slot: PlayerSlot;
  id: Player["id"];
  name: Player["name"];
  ready: boolean;
  coId?: COID;
  army?: Army;
}

export const createNeutralPlayerInMatch: () => PlayerInMatch = () => ({
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
