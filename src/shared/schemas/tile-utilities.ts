import type { ChangeableTile } from "shared/types/server-match-state";
import type { RO } from "shared/types/ww-readonly";
import type { PassableTile, PropertyTile, UnusedSiloTile } from "./tile";

export const isNotNeutralProperty = (propertyTile: PropertyTile): boolean =>
  propertyTile.playerSlot !== -1;

export const isUnitProducingProperty = (
  tile: PassableTile | RO<ChangeableTile>,
): tile is PropertyTile => tile.type === "base" || tile.type === "airport" || tile.type === "port";

export const willBeChangeableTile = (tile: PassableTile): tile is PropertyTile | UnusedSiloTile =>
  // TODO what about pipeSeams?
  ["city", "base", "airport", "port", "lab", "commtower", "hq", "unusedSilo"].includes(tile.type);
