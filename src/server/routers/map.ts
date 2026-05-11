import { prisma } from "server/prisma/prisma-client";
import { arrayAtOrThrow } from "shared/array-utilities";
import { DispatchableError } from "shared/dispatchable-error";
import type { CreatableMap } from "shared/schemas/map";
import { mapSchema } from "shared/schemas/map";
import type { PlayerSlot } from "shared/schemas/player-slot";
import type { TileType } from "shared/schemas/tile";
import { isNotNeutralProperty, isUnitProducingProperty } from "shared/schemas/tile-utilities";
import { publicBaseProcedure, router } from "../trpc/trpc-setup";

export const getPlayerAmountOfMap = (map: CreatableMap): number => {
  const seenPlayerSlots: PlayerSlot[] = [];

  const addToPlayerSlotsIfNotAddedAlready = (item: { playerSlot: PlayerSlot }): void => {
    if (!seenPlayerSlots.includes(item.playerSlot)) {
      seenPlayerSlots.push(item.playerSlot);
    }
  };

  for (const element of map.tiles
    .flat()
    .filter(isUnitProducingProperty)
    .filter(isNotNeutralProperty)) {
    addToPlayerSlotsIfNotAddedAlready(element);
  }

  for (const element of map.predeployedUnits) {
    addToPlayerSlotsIfNotAddedAlready(element);
  }

  return seenPlayerSlots.length;
};

/**
 * This is the list of tile types that are shown
 * on the map list.
 */
const propertyTileTypes = [
  "city",
  "base",
  "airport",
  "commtower",
  "lab",
  "port",
] satisfies TileType[];

export const mapRouter = router({
  getAll: publicBaseProcedure.query(async () => {
    // TODO pagination / filter / search
    const allMaps = await prisma.wWMap.findMany();

    return allMaps.map((map) => ({
      id: map.id,
      name: map.name,
      author: "not implemented",
      numberOfPlayers: map.numberOfPlayers,
      // TODO which armies exactly?
      size: {
        width: arrayAtOrThrow(map.tiles, 0).length,
        height: map.tiles.length,
      },
      propertyStats2: propertyTileTypes.map((type) => ({
        type,
        count: map.tiles.flat().filter((tile) => tile.type === type).length,
      })),
      created: map.createdAt,
    }));
  }),
  save: publicBaseProcedure.input(mapSchema).mutation(async ({ input }) => {
    const numberOfPlayers = getPlayerAmountOfMap(input);

    if (numberOfPlayers > 2) {
      throw new DispatchableError("Map must be playable by at least 2 players");
    }

    if (input.tiles.some((row) => row.length !== arrayAtOrThrow(input.tiles, 0).length)) {
      throw new DispatchableError("All rows of the map must have the same length");
    }

    return prisma.wWMap.create({
      data: {
        ...input,
        numberOfPlayers,
      },
    });
  }),
});
