import type { Sprite } from "pixi.js";
import type { PositionedTile } from "shared/schemas/tile";

export type ChangeableTileWithSprite = PositionedTile & { sprite?: Sprite };
