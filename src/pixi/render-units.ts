import { /* AnimatedSprite,*/ Container } from "pixi.js";
import type { MatchWrapper } from "shared/wrappers/match/match";
import type { LoadedSpriteSheet } from "./load-spritesheet";
import { renderUnitSprite } from "./render-unit-sprite";

export function renderUnits(match: MatchWrapper, spriteSheets: LoadedSpriteSheet) {
  const unitContainer = new Container();

  for (const unit of match.units) {
    unitContainer.addChild(renderUnitSprite(unit, spriteSheets));
  }

  return unitContainer;
}
