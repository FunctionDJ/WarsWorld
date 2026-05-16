import type { Application } from "pixi.js";
import type { Position } from "shared/schemas/position";
import type { MatchWrapper } from "shared/wrappers/match";
import type { LoadedSpriteSheet } from "./load-spritesheet";
import { renderInvisInteractiveTiles, renderMap } from "./render-map";
import { renderUnits } from "./render-units";

export function setupApp(
  app: Application,
  match: MatchWrapper,
  renderMultiplier: number,
  spriteSheets: LoadedSpriteSheet,
  onTileClick: (pos: Position) => Promise<void>,
  onTileHover: (pos: Position) => Promise<void>,
) {
  app.stage.position.set(0, 0);
  app.stage.sortableChildren = true;
  app.stage.scale.set(renderMultiplier, renderMultiplier);

  const mapContainer = renderMap(match, spriteSheets);
  const unitContainer = renderUnits(match, spriteSheets);
  const interactiveContainer = renderInvisInteractiveTiles(match, onTileClick, onTileHover);

  mapContainer.label = "mapContainer";
  unitContainer.label = "childContainer";
  interactiveContainer.label = "interactiveTilesContainer";

  app.stage.addChild(mapContainer, unitContainer, interactiveContainer);

  return { mapContainer, unitContainer, interactiveContainer };
}
