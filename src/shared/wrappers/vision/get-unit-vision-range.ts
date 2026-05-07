import { unitPropertiesMap } from "shared/match-logic/game-constants/unit-properties";
import type { UnitWrapper } from "../unit/unit";

export const getUnitVisionRange = (unit: UnitWrapper): number => {
  const { vision: baseVision } = unitPropertiesMap[unit.data.type];

  const hasMountainBonus = unit.isInfantryOrMech() && unit.getTile().type === "mountain";
  const modifiedVision = unit.player.getHook("vision")?.(baseVision);
  const coVisionRange = (modifiedVision ?? baseVision) + (hasMountainBonus ? 3 : 0);

  const weatherVisionRange =
    unit.player.match.getCurrentWeather() === "rain" ? coVisionRange - 1 : coVisionRange;

  return Math.max(weatherVisionRange, 0);
};
