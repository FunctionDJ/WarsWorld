import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SpritesheetData, SpritesheetFrameData } from "pixi.js";
import { throwIfUndefined } from "shared/types/throw-helper";
import sharp from "sharp";
import yargs from "yargs";

// configurable parameters
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-type-assertion
const { texturesBasePath, outputPath } = yargs(process.argv.slice(2))
  .option("texturesBasePath", {
    alias: "t", // -t
    type: "string",
    description: "Path to obtain textures at",
    default: "AWBW-Replay-Player/AWBWApp.Resources/Textures",
  })
  .option("outputPath", {
    alias: "o",
    type: "string",
    description: "Path to save processed sprites to",
    default: "output",
  }).argv as { texturesBasePath: string; outputPath: string };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const nations = await fs.readdir(path.resolve(__dirname, texturesBasePath, "Units"));

const spriteSources = {
  map: "Map/AW2",
  unit: "Units",
} as const;
type SpriteType = keyof typeof spriteSources;
interface Sprite {
  type: SpriteType;
  name: string;
}

for (const nation of nations) {
  // fetch sprites
  const allSprites = await getAllSprites(nation);
  // generate frames and spritesheet image
  const { frames, spriteSheetImage } = await genFramesAndSpriteSheetImage(nation, allSprites);
  // fetch animations map
  const animations = fetchAnimations(allSprites);

  // write WebP files
  await spriteSheetImage
    .composite(
      Object.entries(frames).map(([key, { frame }]) => {
        const [source, name] = key.split(".");

        if (source !== "map" && source !== "unit") {
          throw new Error(
            `can't handle this frame key for compositing the file, source: ${String(source)}`,
          );
        }

        const definedName = throwIfUndefined(
          name,
          `can't handle this frame key for compositing the file, name is undefined`,
        );

        return {
          input: getTexturePath(source, nation, definedName + ".png"),
          left: frame.x,
          top: frame.y,
        };
      }),
    )
    .toFile(path.resolve(__dirname, outputPath, `${nation}.webp`));

  // write JSON files
  const spriteSheetData: SpritesheetData = {
    meta: { scale: 1 },
    frames,
    animations,
  };
  await fs.writeFile(
    path.resolve(__dirname, outputPath, `${nation}.json`),
    // eslint-disable-next-line unicorn/no-null
    JSON.stringify(spriteSheetData, null, 2),
  );
}

function getTexturePath(spriteType: SpriteType, spriteNation: string, spriteName?: string): string {
  return path.resolve(
    __dirname,
    texturesBasePath, // e.g. AWBW-Replay-Player/AWBWApp.Resources/Textures
    spriteSources[spriteType], // e.g. Units
    spriteNation, // e.g. OrangeStar
    spriteName ?? "", // e.g. APC_MSide-2.png
  );
}

async function getAllSprites(nation: string): Promise<Sprite[]> {
  /**
   * Returns an array with the paths of all sprites
   * For example, if we find AWBW-Replay-Player/AWBWApp.Resources/Textures/Units/OrangeStar/APC_MSide-2.png,
   *   we generate {unit, APC_MSide-2} : Sprite
   */
  const allSprites: Sprite[] = [];

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-type-assertion
  for (const spriteType of Object.keys(spriteSources) as SpriteType[]) {
    // TODO a better way to do this
    const sprites = await fs.readdir(getTexturePath(spriteType, nation));
    allSprites.push(...sprites.map((s): Sprite => ({ type: spriteType, name: s })));
  }

  if (allSprites.length === 0) {
    throw new Error("No input - spritesheet would be empty.");
  }

  return allSprites;
}

async function genFramesAndSpriteSheetImage(
  nation: string,
  allSprites: Sprite[],
): Promise<{ frames: Record<string, SpritesheetFrameData>; spriteSheetImage: sharp.Sharp }> {
  /**
   * Generates frames with appropriate dimensions for given sprites
   */
  const columnsCount = Math.round(Math.sqrt(allSprites.length));
  // const rowsCount = Math.ceil(allSprites.length / columnsCount);

  // compute max cell width and height
  let cellWidth = 0;
  let cellHeight = 0;

  for (const sprite of allSprites) {
    const { width, height } = await sharp(
      // example: .../Textures/Units/OrangeStar/APC_MSide-1.png
      getTexturePath(sprite.type, nation, sprite.name),
    ).metadata();

    cellWidth = Math.max(cellWidth, width);
    cellHeight = Math.max(cellHeight, height);
  }

  // start building the spritesheet image
  const spriteSheetImage = sharp({
    create: {
      width: columnsCount * cellWidth,
      height: columnsCount * cellHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  // build the frames
  const frames: Record<string, SpritesheetFrameData> = {};

  for (const [index, sprite] of allSprites.entries()) {
    const metadata = await sharp(getTexturePath(sprite.type, nation, sprite.name)).metadata();

    const frameData = {
      x: (index % columnsCount) * cellWidth,
      y: Math.floor(index / columnsCount) * cellHeight,
      w: metadata.width,
      h: metadata.height,
    };

    frames[sprite.type + "." + sprite.name] = { frame: frameData };
  }

  return { spriteSheetImage, frames };
}

function fetchAnimations(allSprites: Sprite[]): Record<string, string[]> {
  const animationFrameRegex = /^(.*)-\d+\.png$/i; // capture pattern "Airport-1.png"
  const animationKeys = new Set(
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    allSprites
      .map((sprite) => {
        const result = animationFrameRegex.exec(sprite.name);

        return result?.[1] === undefined
          ? undefined
          : {
              source: sprite.type,
              name: result[1],
            };
      })
      .filter((animationKey) => animationKey !== undefined) as { source: string; name: string }[],
  );

  const animations: Record<string, string[]> = {};

  for (const { source, name } of animationKeys) {
    animations[source + "." + name] = allSprites
      .filter((sprite) => sprite.name.startsWith(name))
      .map((sprite) => sprite.type + "." + sprite.name)
      .toSorted();
  }

  return animations;
}
