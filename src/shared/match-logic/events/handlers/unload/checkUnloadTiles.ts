import { unitPropertiesMap } from "shared/match-logic/game-constants/unit-properties";
import { getBaseMovementCost } from "shared/match-logic/movement-cost";
import { getWeatherSpecialMovement } from "shared/match-logic/weather";
import type { Position } from "shared/schemas/position";
import type { Tile } from "shared/schemas/tile";
import type { UnitType } from "shared/schemas/unit";
import type { ChangeableTile } from "shared/types/server-match-state";
import type { PlayerInMatchWrapper } from "shared/wrappers/player-in-match";
import type { UnitWrapper } from "shared/wrappers/unit";

export const canUnitMoveToTile = (
  unitToUnload: { type: UnitType },
  tile: Tile | ChangeableTile,
  player: PlayerInMatchWrapper,
): boolean => {
  const baseMovementCost = getBaseMovementCost(
    unitPropertiesMap[unitToUnload.type].movementType,
    getWeatherSpecialMovement(player),
    tile.type,
    player.match.rules.gameVersion ?? player.data.coId.version,
  );
  return baseMovementCost !== null;
};

export const getUnloadablePositions = (
  transportUnit: UnitWrapper,
  unitToUnload: { type: UnitType },
  newTransportUnitLocation?: Position,
): Position[] => {
  const transportPos = newTransportUnitLocation ?? transportUnit.data.position;

  //unit also has to be able to stand on the tile the transport is standing
  if (
    !canUnitMoveToTile(
      unitToUnload,
      transportUnit.match.getTile(transportPos),
      transportUnit.player,
    )
  ) {
    return [];
  }

  const unloadablePositions: Position[] = [];

  for (const adjPos of transportPos.getNeighbours()) {
    if (transportUnit.match.map.isOutOfBounds(adjPos)) {
      continue;
    }

    if (
      canUnitMoveToTile(unitToUnload, transportUnit.match.getTile(adjPos), transportUnit.player)
    ) {
      unloadablePositions.push(adjPos);
    }
  }

  return unloadablePositions;
};
