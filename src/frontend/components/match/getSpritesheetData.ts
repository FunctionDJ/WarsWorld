import type { SpritesheetData } from "pixi.js";
import type { Army } from "shared/schemas/army";
import type { PropertyTileType } from "shared/schemas/tile";
import type { UnitTypeString } from "shared/schemas/unit";

export type SheetNames = Army | "neutral" | "arrow" | "icons";

export type SpriteAnimationKeys =
  | PropertyTileType
  | TileAnimationVariants
  | UnitTypeString
  | UnitAnimationVariants;

export type ArmySpritesheetData = SpritesheetData & {
  animations: Record<SpriteAnimationKeys, undefined>;
};

export type SpritesheetDataByArmy = Record<SheetNames, ArmySpritesheetData>;

type TileAnimationVariants = `${PropertyTileType}_${"rain" | "snow"}`;
type UnitMoveDirection = "down" | "side" | "up";
type UnitAnimationVariants = `${UnitTypeString}-m${UnitMoveDirection}`;
