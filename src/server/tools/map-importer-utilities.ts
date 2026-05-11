import type { WWMap } from "generated/client";
import { arrayAtOrThrow, getFromObjectOrThrow } from "shared/array-utilities";
import type { PassableTile } from "shared/schemas/tile";
import { prisma } from "../prisma/prisma-client";

interface AWBWMapImportSchema {
  name: string;
  tileDataString: string;
  numberOfPlayers: 2;
}

export const importAWBWMap = async (data: AWBWMapImportSchema): Promise<WWMap> => {
  try {
    return await prisma.wWMap.create({
      data: {
        name: data.name,
        numberOfPlayers: data.numberOfPlayers,
        tiles: convertAWBWMapToWWMap(data.tileDataString),
        predeployedUnits: [] /* TODO ! */,
      },
    });
  } catch (error) {
    console.error("An error occurred while importing the map");
    throw error;
  }
};

export const convertAWBWMapToWWMap = (tileDataString: string): WWMap["tiles"] => {
  const tileData2DM = tileDataString
    .trim()
    .split("\n")
    .map((l) =>
      l
        .trim()
        .split(",")
        .map((t) => t.trim()),
    );
  const tileDataFlat = tileData2DM.flat();
  const row = arrayAtOrThrow(tileData2DM, 0).length;
  const col = tileData2DM.length;

  const parsedArray: PassableTile[][] = [];

  for (let rowIndex = 0; rowIndex < col; rowIndex++) {
    const emptyArray: PassableTile[] = [];

    for (let columnIndex = 0; columnIndex < row; columnIndex++) {
      emptyArray.push(
        getFromObjectOrThrow(
          awbwTileMapping,
          arrayAtOrThrow(tileDataFlat, columnIndex + rowIndex * row),
        ),
      );
    }

    parsedArray.push(emptyArray);
  }

  return parsedArray;
};

const awbwTileMapping: Record<string, PassableTile> = {
  "1": { category: "variable", type: "plain", variant: "normal" },
  "2": { category: "simple", type: "mountain" },
  "3": { category: "simple", type: "forest" },
  "4": { category: "variable", type: "river", variant: "right-left" },
  "5": { category: "variable", type: "river", variant: "top-bottom" },
  "6": { category: "variable", type: "river", variant: "top-right-bottom-left" },
  "7": { category: "variable", type: "river", variant: "right-bottom" },
  "8": { category: "variable", type: "river", variant: "bottom-left" },
  "9": { category: "variable", type: "river", variant: "top-left" },
  "10": { category: "variable", type: "river", variant: "top-right" },
  "11": { category: "variable", type: "river", variant: "right-bottom-left" },
  "12": { category: "variable", type: "river", variant: "top-bottom-left" },
  "13": { category: "variable", type: "river", variant: "top-right-left" },
  "14": { category: "variable", type: "river", variant: "top-right-bottom" },
  "15": { category: "variable", type: "road", variant: "right-left" },
  "16": { category: "variable", type: "road", variant: "top-bottom" },
  "17": { category: "variable", type: "road", variant: "top-right-bottom-left" },
  "18": { category: "variable", type: "road", variant: "right-bottom" },
  "19": { category: "variable", type: "road", variant: "bottom-left" },
  "20": { category: "variable", type: "road", variant: "top-left" },
  "21": { category: "variable", type: "road", variant: "top-right" },
  "22": { category: "variable", type: "road", variant: "right-bottom-left" },
  "23": { category: "variable", type: "road", variant: "top-bottom-left" },
  "24": { category: "variable", type: "road", variant: "top-right-left" },
  "25": { category: "variable", type: "road", variant: "top-right-bottom" },
  "26": { category: "variable", type: "bridge", variant: "right-left" },
  "27": { category: "variable", type: "bridge", variant: "top-bottom" },
  "28": { category: "simple", type: "sea" },
  "29": { category: "simple", type: "shoal" },
  "30": { category: "simple", type: "shoal" },
  "31": { category: "simple", type: "shoal" },
  "32": { category: "simple", type: "shoal" },
  "33": { category: "simple", type: "reef" },
  "34": { category: "property", type: "city", playerSlot: -1 },
  "35": { category: "property", type: "base", playerSlot: -1 },
  "36": { category: "property", type: "airport", playerSlot: -1 },
  "37": { category: "property", type: "port", playerSlot: -1 },
  "38": { category: "property", type: "city", playerSlot: 0 },
  "39": { category: "property", type: "base", playerSlot: 0 },
  "40": { category: "property", type: "airport", playerSlot: 0 },
  "41": { category: "property", type: "port", playerSlot: 0 },
  "42": { category: "property", type: "hq", playerSlot: 0 },
  "43": { category: "property", type: "city", playerSlot: 1 },
  "44": { category: "property", type: "base", playerSlot: 1 },
  "45": { category: "property", type: "airport", playerSlot: 1 },
  "46": { category: "property", type: "port", playerSlot: 1 },
  "47": { category: "property", type: "hq", playerSlot: 1 },
  "48": { category: "property", type: "city", playerSlot: 2 },
  "49": { category: "property", type: "base", playerSlot: 2 },
  "50": { category: "property", type: "airport", playerSlot: 2 },
  "51": { category: "property", type: "port", playerSlot: 2 },
  "52": { category: "property", type: "hq", playerSlot: 2 },
  "53": { category: "property", type: "city", playerSlot: 3 },
  "54": { category: "property", type: "base", playerSlot: 3 },
  "55": { category: "property", type: "airport", playerSlot: 3 },
  "56": { category: "property", type: "port", playerSlot: 3 },
  "57": { category: "property", type: "hq", playerSlot: 3 },
  "81": { category: "property", type: "city", playerSlot: 5 },
  "82": { category: "property", type: "base", playerSlot: 5 },
  "83": { category: "property", type: "airport", playerSlot: 5 },
  "84": { category: "property", type: "port", playerSlot: 5 },
  "85": { category: "property", type: "hq", playerSlot: 5 },
  "86": { category: "property", type: "city", playerSlot: 6 },
  "87": { category: "property", type: "base", playerSlot: 6 },
  "88": { category: "property", type: "airport", playerSlot: 6 },
  "89": { category: "property", type: "port", playerSlot: 6 },
  "90": { category: "property", type: "hq", playerSlot: 6 },
  "91": { category: "property", type: "city", playerSlot: 4 },
  "92": { category: "property", type: "base", playerSlot: 4 },
  "93": { category: "property", type: "airport", playerSlot: 4 },
  "94": { category: "property", type: "port", playerSlot: 4 },
  "95": { category: "property", type: "hq", playerSlot: 4 },
  "96": { category: "property", type: "city", playerSlot: 7 },
  "97": { category: "property", type: "base", playerSlot: 7 },
  "98": { category: "property", type: "airport", playerSlot: 7 },
  "99": { category: "property", type: "port", playerSlot: 7 },
  "100": { category: "property", type: "hq", playerSlot: 7 },
  "101": { category: "variable", type: "pipe", variant: "right-left" },
  "102": { category: "variable", type: "pipe", variant: "top-bottom" },
  "103": { category: "variable", type: "pipe", variant: "top-right" },
  "104": { category: "variable", type: "pipe", variant: "right-bottom" },
  "105": { category: "variable", type: "pipe", variant: "bottom-left" },
  "106": { category: "variable", type: "pipe", variant: "top-left" },
  "107": { category: "variable", type: "pipe", variant: "top" },
  "108": { category: "variable", type: "pipe", variant: "right" },
  "109": { category: "variable", type: "pipe", variant: "bottom" },
  "110": { category: "variable", type: "pipe", variant: "left" },
  "111": { category: "simple", type: "unusedSilo" },
  "112": { category: "simple", type: "usedSilo" },
  // TODO figure out what the heck is wrong with pipeSeams, like their role in the system (variable? changingTile?)
  // "113": { category: "variable", type: "pipeSeam", variant: "right-left", hp: 100 },
  // "114": { category: "variable", type: "pipeSeam", variant: "top-bottom", hp: 100 },
  "115": { category: "variable", type: "plain", variant: "broken-pipe-right-left" },
  "116": { category: "variable", type: "plain", variant: "broken-pipe-top-bottom" },
  "117": { category: "property", type: "base", playerSlot: 8 },
  "118": { category: "property", type: "airport", playerSlot: 8 },
  "119": { category: "property", type: "city", playerSlot: 8 },
  "120": { category: "property", type: "hq", playerSlot: 8 },
  "121": { category: "property", type: "port", playerSlot: 8 },
  "122": { category: "property", type: "base", playerSlot: 9 },
  "123": { category: "property", type: "airport", playerSlot: 9 },
  "124": { category: "property", type: "city", playerSlot: 9 },
  "125": { category: "property", type: "hq", playerSlot: 9 },
  "126": { category: "property", type: "port", playerSlot: 9 },
  "127": { category: "property", type: "commtower", playerSlot: 8 },
  "128": { category: "property", type: "commtower", playerSlot: 4 },
  "129": { category: "property", type: "commtower", playerSlot: 1 },
  "130": { category: "property", type: "commtower", playerSlot: 7 },
  "131": { category: "property", type: "commtower", playerSlot: 2 },
  "132": { category: "property", type: "commtower", playerSlot: 9 },
  "133": { category: "property", type: "commtower", playerSlot: -1 },
  "134": { category: "property", type: "commtower", playerSlot: 0 },
  "135": { category: "property", type: "commtower", playerSlot: 5 },
  "136": { category: "property", type: "commtower", playerSlot: 3 },
  "137": { category: "property", type: "commtower", playerSlot: 6 },
  "138": { category: "property", type: "lab", playerSlot: 8 },
  "139": { category: "property", type: "lab", playerSlot: 4 },
  "140": { category: "property", type: "lab", playerSlot: 1 },
  "141": { category: "property", type: "lab", playerSlot: 7 },
  "142": { category: "property", type: "lab", playerSlot: 2 },
  "143": { category: "property", type: "lab", playerSlot: 6 },
  "144": { category: "property", type: "lab", playerSlot: 9 },
  "145": { category: "property", type: "lab", playerSlot: -1 },
  "146": { category: "property", type: "lab", playerSlot: 0 },
  "147": { category: "property", type: "lab", playerSlot: 5 },
  "148": { category: "property", type: "lab", playerSlot: 3 },
  "149": { category: "property", type: "airport", playerSlot: 10 },
  "150": { category: "property", type: "base", playerSlot: 10 },
  "151": { category: "property", type: "city", playerSlot: 10 },
  "152": { category: "property", type: "commtower", playerSlot: 10 },
  "153": { category: "property", type: "hq", playerSlot: 10 },
  "154": { category: "property", type: "lab", playerSlot: 10 },
  "155": { category: "property", type: "port", playerSlot: 10 },
  "156": { category: "property", type: "airport", playerSlot: 11 },
  "157": { category: "property", type: "base", playerSlot: 11 },
  "158": { category: "property", type: "city", playerSlot: 11 },
  "159": { category: "property", type: "commtower", playerSlot: 11 },
  "160": { category: "property", type: "hq", playerSlot: 11 },
  "161": { category: "property", type: "lab", playerSlot: 11 },
  "162": { category: "property", type: "port", playerSlot: 11 },
  "163": { category: "property", type: "airport", playerSlot: 12 },
  "164": { category: "property", type: "base", playerSlot: 12 },
  "165": { category: "property", type: "city", playerSlot: 12 },
  "166": { category: "property", type: "commtower", playerSlot: 12 },
  "167": { category: "property", type: "hq", playerSlot: 12 },
  "168": { category: "property", type: "lab", playerSlot: 12 },
  "169": { category: "property", type: "port", playerSlot: 12 },
  "170": { category: "property", type: "airport", playerSlot: 13 },
  "171": { category: "property", type: "base", playerSlot: 13 },
  "172": { category: "property", type: "city", playerSlot: 13 },
  "173": { category: "property", type: "commtower", playerSlot: 13 },
  "174": { category: "property", type: "hq", playerSlot: 13 },
  "175": { category: "property", type: "lab", playerSlot: 13 },
  "176": { category: "property", type: "port", playerSlot: 13 },
  "181": { category: "property", type: "airport", playerSlot: 14 },
  "182": { category: "property", type: "base", playerSlot: 14 },
  "183": { category: "property", type: "city", playerSlot: 14 },
  "184": { category: "property", type: "commtower", playerSlot: 14 },
  "185": { category: "property", type: "hq", playerSlot: 14 },
  "186": { category: "property", type: "lab", playerSlot: 14 },
  "187": { category: "property", type: "port", playerSlot: 14 },
  "188": { category: "property", type: "airport", playerSlot: 15 },
  "189": { category: "property", type: "base", playerSlot: 15 },
  "190": { category: "property", type: "city", playerSlot: 15 },
  "191": { category: "property", type: "commtower", playerSlot: 15 },
  "192": { category: "property", type: "hq", playerSlot: 15 },
  "193": { category: "property", type: "lab", playerSlot: 15 },
  "194": { category: "property", type: "port", playerSlot: 15 },
};
