import type { SpritesheetData } from "pixi.js";
import type { Army } from "shared/schemas/army";
import { propertyTileSchema } from "shared/schemas/tile";
import type { UnitType } from "shared/schemas/unit-schemas";
import type { z } from "zod";

export type SheetNames = Army | "neutral" | "arrow" | "icons";

export type SpriteAnimationKeys =
  | PropertyTileType
  | TileAnimationVariants
  | UnitType
  | UnitAnimationVariants;

export type ArmySpritesheetData = SpritesheetData & {
  animations: Record<SpriteAnimationKeys, undefined>;
};

export type SpritesheetDataByArmy = Record<SheetNames, ArmySpritesheetData>;

type PropertyTileType = z.infer<typeof propertyTileSchema>["type"];
type TileAnimationVariants = `${PropertyTileType}_${"rain" | "snow"}`;
type UnitMoveDirection = "down" | "side" | "up";
type UnitAnimationVariants = `${UnitType}-m${UnitMoveDirection}`;
