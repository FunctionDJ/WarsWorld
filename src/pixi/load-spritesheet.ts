import type {
  ArmySpritesheetData,
  SheetNames,
  SpritesheetDataByArmy,
} from "frontend/components/match/getSpritesheetData";
import { Spritesheet, Texture } from "pixi.js";

export type LoadedSpriteSheet = Record<SheetNames, Spritesheet<ArmySpritesheetData>>;

//This function transforms our RAW spritesheets into finer spritesheets pixi can read well, this is client-side
export async function loadSpritesFromSpriteMap(
  spriteMap: SpritesheetDataByArmy,
): Promise<LoadedSpriteSheet> {
  const pixiSpriteSheets: Partial<LoadedSpriteSheet> = {};

  for (const sheetName in spriteMap) {
    const rawSpriteSheet = spriteMap[sheetName as SheetNames];

    if (rawSpriteSheet !== undefined) {
      if (rawSpriteSheet.meta.image === undefined) {
        throw new Error(`No spritesheet image found for ${sheetName}`);
      }

      const imageSource = new ImageSource(`/img/spriteSheet/${rawSpriteSheet.meta.image}`);

      const pixiSheet = new Spritesheet<ArmySpritesheetData>(
        Texture.from(imageSource, {
          scaleMode: "nearest",
        }),
        rawSpriteSheet,
      );

      await pixiSheet.parse();
      pixiSpriteSheets[sheetName as SheetNames] = pixiSheet;
      // clearTextureCache(); https://github.com/pixijs/pixijs/issues/10288
    }
  }

  return pixiSpriteSheets as LoadedSpriteSheet;
}
