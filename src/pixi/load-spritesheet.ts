import type {
  ArmySpritesheetData,
  SheetNames,
  SpritesheetDataByArmy,
} from "frontend/components/match/get-spritesheet-data";
import { ImageSource, Spritesheet, Texture } from "pixi.js";
import type { WWReadOnly } from "shared/types/ww-readonly";

export type MutableLoadedSpriteSheet = Record<SheetNames, Spritesheet<ArmySpritesheetData>>;
export type LoadedSpriteSheet = WWReadOnly<MutableLoadedSpriteSheet>;

export async function loadSpritesFromSpriteMap(
  spriteMap: SpritesheetDataByArmy,
): Promise<LoadedSpriteSheet> {
  const pixiSpriteSheets: Partial<MutableLoadedSpriteSheet> = {};

  for (const sheetName in spriteMap) {
    const rawSpriteSheet = spriteMap[sheetName as SheetNames];

    if (rawSpriteSheet.meta.image === undefined) {
      throw new Error(`No spritesheet image found for ${sheetName}`);
    }

    const image = new Image();
    image.src = `/img/spriteSheet/${rawSpriteSheet.meta.image}`;

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    const imageSource = new ImageSource({
      resource: image,
    });

    const pixiSheet = new Spritesheet<ArmySpritesheetData>(
      Texture.from(imageSource), // TODO scaleMode = nearest - where does this go?
      rawSpriteSheet,
    );

    await pixiSheet.parse();
    pixiSpriteSheets[sheetName as SheetNames] = pixiSheet;
    // clearTextureCache(); https://github.com/pixijs/pixijs/issues/10288
  }

  return pixiSpriteSheets as LoadedSpriteSheet;
}
