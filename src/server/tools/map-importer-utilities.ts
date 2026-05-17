import type { WWMap } from "generated/client";
import { arrayAtOrThrow, getFromObjectOrThrow } from "shared/array-utilities";
import type { Tile } from "shared/schemas/tile";
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
				predeployedUnits: [], // [missing-implementation]
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

	const parsedArray: Tile[][] = [];

	for (let rowIndex = 0; rowIndex < col; rowIndex++) {
		const emptyArray: Tile[] = [];

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

const awbwTileMapping: Record<string, Tile> = {
	1: { type: "plain", variant: "normal" },
	2: { type: "mountain" },
	3: { type: "forest" },
	4: { type: "river", variant: "right-left" },
	5: { type: "river", variant: "top-bottom" },
	6: { type: "river", variant: "top-right-bottom-left" },
	7: { type: "river", variant: "right-bottom" },
	8: { type: "river", variant: "bottom-left" },
	9: { type: "river", variant: "top-left" },
	10: { type: "river", variant: "top-right" },
	11: { type: "river", variant: "right-bottom-left" },
	12: { type: "river", variant: "top-bottom-left" },
	13: { type: "river", variant: "top-right-left" },
	14: { type: "river", variant: "top-right-bottom" },
	15: { type: "road", variant: "right-left" },
	16: { type: "road", variant: "top-bottom" },
	17: { type: "road", variant: "top-right-bottom-left" },
	18: { type: "road", variant: "right-bottom" },
	19: { type: "road", variant: "bottom-left" },
	20: { type: "road", variant: "top-left" },
	21: { type: "road", variant: "top-right" },
	22: { type: "road", variant: "right-bottom-left" },
	23: { type: "road", variant: "top-bottom-left" },
	24: { type: "road", variant: "top-right-left" },
	25: { type: "road", variant: "top-right-bottom" },
	26: { type: "bridge", variant: "right-left" },
	27: { type: "bridge", variant: "top-bottom" },
	28: { type: "sea" },
	29: { type: "shoal" },
	30: { type: "shoal" },
	31: { type: "shoal" },
	32: { type: "shoal" },
	33: { type: "reef" },
	34: { hp: 20, type: "city", playerSlot: -1 },
	35: { hp: 20, type: "base", playerSlot: -1 },
	36: { hp: 20, type: "airport", playerSlot: -1 },
	37: { hp: 20, type: "port", playerSlot: -1 },
	38: { hp: 20, type: "city", playerSlot: 0 },
	39: { hp: 20, type: "base", playerSlot: 0 },
	40: { hp: 20, type: "airport", playerSlot: 0 },
	41: { hp: 20, type: "port", playerSlot: 0 },
	42: { hp: 20, type: "hq", playerSlot: 0 },
	43: { hp: 20, type: "city", playerSlot: 1 },
	44: { hp: 20, type: "base", playerSlot: 1 },
	45: { hp: 20, type: "airport", playerSlot: 1 },
	46: { hp: 20, type: "port", playerSlot: 1 },
	47: { hp: 20, type: "hq", playerSlot: 1 },
	48: { hp: 20, type: "city", playerSlot: 2 },
	49: { hp: 20, type: "base", playerSlot: 2 },
	50: { hp: 20, type: "airport", playerSlot: 2 },
	51: { hp: 20, type: "port", playerSlot: 2 },
	52: { hp: 20, type: "hq", playerSlot: 2 },
	53: { hp: 20, type: "city", playerSlot: 3 },
	54: { hp: 20, type: "base", playerSlot: 3 },
	55: { hp: 20, type: "airport", playerSlot: 3 },
	56: { hp: 20, type: "port", playerSlot: 3 },
	57: { hp: 20, type: "hq", playerSlot: 3 },
	81: { hp: 20, type: "city", playerSlot: 5 },
	82: { hp: 20, type: "base", playerSlot: 5 },
	83: { hp: 20, type: "airport", playerSlot: 5 },
	84: { hp: 20, type: "port", playerSlot: 5 },
	85: { hp: 20, type: "hq", playerSlot: 5 },
	86: { hp: 20, type: "city", playerSlot: 6 },
	87: { hp: 20, type: "base", playerSlot: 6 },
	88: { hp: 20, type: "airport", playerSlot: 6 },
	89: { hp: 20, type: "port", playerSlot: 6 },
	90: { hp: 20, type: "hq", playerSlot: 6 },
	91: { hp: 20, type: "city", playerSlot: 4 },
	92: { hp: 20, type: "base", playerSlot: 4 },
	93: { hp: 20, type: "airport", playerSlot: 4 },
	94: { hp: 20, type: "port", playerSlot: 4 },
	95: { hp: 20, type: "hq", playerSlot: 4 },
	96: { hp: 20, type: "city", playerSlot: 7 },
	97: { hp: 20, type: "base", playerSlot: 7 },
	98: { hp: 20, type: "airport", playerSlot: 7 },
	99: { hp: 20, type: "port", playerSlot: 7 },
	100: { hp: 20, type: "hq", playerSlot: 7 },
	101: { type: "pipe", variant: "right-left" },
	102: { type: "pipe", variant: "top-bottom" },
	103: { type: "pipe", variant: "top-right" },
	104: { type: "pipe", variant: "right-bottom" },
	105: { type: "pipe", variant: "bottom-left" },
	106: { type: "pipe", variant: "top-left" },
	107: { type: "pipe", variant: "top" },
	108: { type: "pipe", variant: "right" },
	109: { type: "pipe", variant: "bottom" },
	110: { type: "pipe", variant: "left" },
	111: { type: "unusedSilo" },
	112: { type: "usedSilo" },
	113: { type: "pipeSeam", variant: "right-left", hp: 100 },
	114: { type: "pipeSeam", variant: "top-bottom", hp: 100 },
	115: { type: "plain", variant: "broken-pipe-right-left" },
	116: { type: "plain", variant: "broken-pipe-top-bottom" },
	117: { hp: 20, type: "base", playerSlot: 8 },
	118: { hp: 20, type: "airport", playerSlot: 8 },
	119: { hp: 20, type: "city", playerSlot: 8 },
	120: { hp: 20, type: "hq", playerSlot: 8 },
	121: { hp: 20, type: "port", playerSlot: 8 },
	122: { hp: 20, type: "base", playerSlot: 9 },
	123: { hp: 20, type: "airport", playerSlot: 9 },
	124: { hp: 20, type: "city", playerSlot: 9 },
	125: { hp: 20, type: "hq", playerSlot: 9 },
	126: { hp: 20, type: "port", playerSlot: 9 },
	127: { hp: 20, type: "commtower", playerSlot: 8 },
	128: { hp: 20, type: "commtower", playerSlot: 4 },
	129: { hp: 20, type: "commtower", playerSlot: 1 },
	130: { hp: 20, type: "commtower", playerSlot: 7 },
	131: { hp: 20, type: "commtower", playerSlot: 2 },
	132: { hp: 20, type: "commtower", playerSlot: 9 },
	133: { hp: 20, type: "commtower", playerSlot: -1 },
	134: { hp: 20, type: "commtower", playerSlot: 0 },
	135: { hp: 20, type: "commtower", playerSlot: 5 },
	136: { hp: 20, type: "commtower", playerSlot: 3 },
	137: { hp: 20, type: "commtower", playerSlot: 6 },
	138: { hp: 20, type: "lab", playerSlot: 8 },
	139: { hp: 20, type: "lab", playerSlot: 4 },
	140: { hp: 20, type: "lab", playerSlot: 1 },
	141: { hp: 20, type: "lab", playerSlot: 7 },
	142: { hp: 20, type: "lab", playerSlot: 2 },
	143: { hp: 20, type: "lab", playerSlot: 6 },
	144: { hp: 20, type: "lab", playerSlot: 9 },
	145: { hp: 20, type: "lab", playerSlot: -1 },
	146: { hp: 20, type: "lab", playerSlot: 0 },
	147: { hp: 20, type: "lab", playerSlot: 5 },
	148: { hp: 20, type: "lab", playerSlot: 3 },
	149: { hp: 20, type: "airport", playerSlot: 10 },
	150: { hp: 20, type: "base", playerSlot: 10 },
	151: { hp: 20, type: "city", playerSlot: 10 },
	152: { hp: 20, type: "commtower", playerSlot: 10 },
	153: { hp: 20, type: "hq", playerSlot: 10 },
	154: { hp: 20, type: "lab", playerSlot: 10 },
	155: { hp: 20, type: "port", playerSlot: 10 },
	156: { hp: 20, type: "airport", playerSlot: 11 },
	157: { hp: 20, type: "base", playerSlot: 11 },
	158: { hp: 20, type: "city", playerSlot: 11 },
	159: { hp: 20, type: "commtower", playerSlot: 11 },
	160: { hp: 20, type: "hq", playerSlot: 11 },
	161: { hp: 20, type: "lab", playerSlot: 11 },
	162: { hp: 20, type: "port", playerSlot: 11 },
	163: { hp: 20, type: "airport", playerSlot: 12 },
	164: { hp: 20, type: "base", playerSlot: 12 },
	165: { hp: 20, type: "city", playerSlot: 12 },
	166: { hp: 20, type: "commtower", playerSlot: 12 },
	167: { hp: 20, type: "hq", playerSlot: 12 },
	168: { hp: 20, type: "lab", playerSlot: 12 },
	169: { hp: 20, type: "port", playerSlot: 12 },
	170: { hp: 20, type: "airport", playerSlot: 13 },
	171: { hp: 20, type: "base", playerSlot: 13 },
	172: { hp: 20, type: "city", playerSlot: 13 },
	173: { hp: 20, type: "commtower", playerSlot: 13 },
	174: { hp: 20, type: "hq", playerSlot: 13 },
	175: { hp: 20, type: "lab", playerSlot: 13 },
	176: { hp: 20, type: "port", playerSlot: 13 },
	181: { hp: 20, type: "airport", playerSlot: 14 },
	182: { hp: 20, type: "base", playerSlot: 14 },
	183: { hp: 20, type: "city", playerSlot: 14 },
	184: { hp: 20, type: "commtower", playerSlot: 14 },
	185: { hp: 20, type: "hq", playerSlot: 14 },
	186: { hp: 20, type: "lab", playerSlot: 14 },
	187: { hp: 20, type: "port", playerSlot: 14 },
	188: { hp: 20, type: "airport", playerSlot: 15 },
	189: { hp: 20, type: "base", playerSlot: 15 },
	190: { hp: 20, type: "city", playerSlot: 15 },
	191: { hp: 20, type: "commtower", playerSlot: 15 },
	192: { hp: 20, type: "hq", playerSlot: 15 },
	193: { hp: 20, type: "lab", playerSlot: 15 },
	194: { hp: 20, type: "port", playerSlot: 15 },
};
