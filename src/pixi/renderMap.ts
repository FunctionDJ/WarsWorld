import { baseTileSize, mapBorder } from "components/client-only/common";
import type { SpriteAnimationKeys } from "frontend/components/match/getSpritesheetData";
import { AnimatedSprite, Container, Sprite, Texture } from "pixi.js";
import { arrayAtOrThrow } from "shared/array-utilities";
import { Position } from "shared/schemas/position";
import type { PassableTile } from "shared/schemas/tile";
import type { ChangeableTile } from "shared/types/server-match-state";
import type { MatchWrapper } from "shared/wrappers/match/match";
import type { LoadedSpriteSheet } from "./load-spritesheet";

type AnimationsProperty = Record<SpriteAnimationKeys, Texture[]>;

function getTileSprite(
  match: MatchWrapper,
  tile: ChangeableTile | PassableTile,
  spriteSheets: LoadedSpriteSheet,
): Sprite {
  if (!("playerSlot" in tile)) {
    let spriteName: string = tile.type;

    if ("fired" in tile && tile.fired) {
      spriteName = "usedSilo";
    }

    if ("variant" in tile) {
      spriteName += `-${tile.variant}`;
    }

    return new Sprite(spriteSheets.neutral.textures[`${spriteName}.png`]);
  }

  if (tile.playerSlot === -1) {
    return new Sprite(spriteSheets.neutral.textures[tile.type + "-0.png"]);
  }

  const player = match.getPlayerBySlotOrThrow(tile.playerSlot);
  // for some reason pixi's spritesheet type doesn't index the generic properly, hence overwriting.
  const animations = spriteSheets[player.data.army].animations as AnimationsProperty;
  const tileSprite = new AnimatedSprite(animations[tile.type]);
  tileSprite.animationSpeed = 0.04;
  tileSprite.play();

  return tileSprite;
}

export function renderMap(match: MatchWrapper, spriteSheets: LoadedSpriteSheet) {
  const mapContainer = new Container(); // TODO add x,y values for margin/border
  mapContainer.x = mapBorder;
  mapContainer.y = mapBorder;
  const { tiles } = match.map.data;

  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < arrayAtOrThrow(tiles, y).length; x++) {
      const tile = match.getTile(new Position([x, y]));

      const tileSprite = getTileSprite(match, tile, spriteSheets);

      // makes our sprites render at the bottom, not from the top.
      tileSprite.anchor.set(0, 1);

      tileSprite.x = x * baseTileSize;
      tileSprite.y = (y + 1) * baseTileSize;
      tileSprite.zIndex = y;
      mapContainer.addChild(tileSprite);

      if ("sprite" in tile) {
        tile.sprite = tileSprite;
      }
    }
  }

  //allows for us to use zIndex on the children of mapContainer
  mapContainer.sortableChildren = true;

  return mapContainer;
}

export const renderInvisInteractiveTiles = (
  match: MatchWrapper,
  onTileClick: (pos: Position) => Promise<void>,
  onTileHover: (pos: Position) => Promise<void>,
) => {
  const mapContainer = new Container();
  mapContainer.x = baseTileSize / 2;
  mapContainer.y = baseTileSize / 2;
  const { tiles } = match.map.data;

  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < arrayAtOrThrow(tiles, y).length; x++) {
      const tileSprite = new Sprite(Texture.EMPTY);
      tileSprite.height = baseTileSize;
      tileSprite.width = baseTileSize;

      // makes our sprites render at the bottom, not from the top.
      tileSprite.anchor.set(0, 1);

      tileSprite.x = x * baseTileSize;
      tileSprite.y = (y + 1) * baseTileSize;

      tileSprite.interactive = true;

      const pos = new Position([x, y]);

      tileSprite.on("pointertap", () => {
        void onTileClick(pos);
      });

      tileSprite.on("pointerenter", () => {
        void onTileHover(pos);
      });

      mapContainer.addChild(tileSprite);
    }
  }

  //allows for us to use zIndex on the children of mapContainer
  mapContainer.sortableChildren = true;

  return mapContainer;
};
