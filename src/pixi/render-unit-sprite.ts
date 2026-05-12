import { baseTileSize } from "components/client-only/common";
import type { FrontendUnit } from "frontend/components/match/frontend-unit";
import { AnimatedSprite, Container, Sprite } from "pixi.js";
import { getFromObjectOrThrow } from "shared/array-utilities";
import { Position } from "shared/schemas/position";
import type { RO } from "shared/types/ww-readonly";
import type { UnitWrapper } from "../shared/wrappers/unit/unit";
import type { LoadedSpriteSheet } from "./load-spritesheet";

type UnitType = FrontendUnit | UnitWrapper;
interface SpritePosition {
  x: number;
  y: number;
}

function calculatePosition(position: Position, offset = 8): SpritePosition {
  return {
    x: position.data[0] * baseTileSize + offset,
    y: position.data[1] * baseTileSize + offset,
  };
}

function createIcon(spriteSheet: RO<LoadedSpriteSheet>, pos: Position, texture: string): Sprite {
  const icon = new Sprite(spriteSheet.icons.textures[texture]);
  icon.x = pos.data[0];
  icon.y = pos.data[1];
  icon.width = 8;
  icon.height = 8;
  icon.eventMode = "static";
  icon.zIndex = 999;
  return icon;
}

export function renderUnitSprite(
  unit: UnitType,
  spriteSheets: LoadedSpriteSheet,
  newPosition?: Position | undefined,
): Container {
  const position = newPosition ?? unit.data.position;
  const spritePosition = calculatePosition(position);

  // Create unit container and sprite
  const unitContainer = new Container();
  const armySpriteSheet = spriteSheets[unit.player.data.army];
  const unitSprite = new AnimatedSprite(
    getFromObjectOrThrow(armySpriteSheet.animations, unit.data.type),
  );

  // Configure unit sprite
  unitSprite.x = spritePosition.x;
  unitSprite.y = spritePosition.y;
  unitSprite.animationSpeed = 0.07;

  if (!unit.data.isReady) {
    unitSprite.tint = "#bbbbbb";
  }

  unitSprite.play();
  unitContainer.label = `unit-${String(position.data[0])}-${String(position.data[1])}`;
  unitContainer.addChild(unitSprite);

  // Add capture points icon if applicable
  if ("currentCapturePoints" in unit.data && unit.data.currentCapturePoints !== undefined) {
    const captureIcon = createIcon(
      spriteSheets,
      new Position([spritePosition.x, spritePosition.y + 8]),
      "capturing.png",
    );
    unitContainer.addChild(captureIcon);
  }

  // Add HP icon if not at full health
  const visualHP = unit.getVisualHP();

  if (visualHP !== 10) {
    const healthIcon = createIcon(
      spriteSheets,
      new Position([spritePosition.x + 8, spritePosition.y + 8]),
      `health-${String(visualHP)}.png`,
    );
    unitContainer.addChild(healthIcon);
  }

  return unitContainer;
}
