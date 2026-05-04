import type {
  ArmySpritesheetData,
  SheetNames,
  SpritesheetDataByArmy,
} from "frontend/components/match/getSpritesheetData";
import { ImageSource, Spritesheet, Texture } from "pixi.js";

export type LoadedSpriteSheet = Record<SheetNames, Spritesheet<ArmySpritesheetData>>;

export async function loadSpritesFromSpriteMap(
  spriteMap: SpritesheetDataByArmy,
): Promise<LoadedSpriteSheet> {
  const pixiSpriteSheets: Partial<LoadedSpriteSheet> = {};

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
