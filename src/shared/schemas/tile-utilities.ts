import type { ChangeableTile } from "shared/types/server-match-state";
import type { WWReadOnly } from "shared/types/ww-readonly";
import type { PassableTile, PipeSeamTile, PropertyTile, UnusedSiloTile } from "./tile";

export const isNotNeutralProperty = (propertyTile: PropertyTile): boolean =>
  propertyTile.playerSlot !== -1;

export const isUnitProducingProperty = (
  tile: PassableTile | WWReadOnly<ChangeableTile>,
): tile is PropertyTile => tile.type === "base" || tile.type === "airport" || tile.type === "port";

export const willBeChangeableTile = (
  tile: PassableTile,
): tile is PropertyTile | UnusedSiloTile | PipeSeamTile =>
  ["city", "base", "airport", "port", "lab", "commtower", "hq", "unusedSilo", "pipeSeam"].includes(
    tile.type,
  );
