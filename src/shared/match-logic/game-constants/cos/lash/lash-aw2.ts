import type { COProperties } from "../../../co";
import { getTerrainDefenseStars } from "../../terrain-properties";

export const lashAW2: COProperties = {
  displayName: "Lash",
  gameVersion: "AW2",
  dayToDay: {
    description: "Units gain 10% firepower per terrain star (air units don't get terrain stars).",
    hooks: {
      attack({ attacker }) {
        if (attacker.properties.facility !== "airport") {
          const terrainStars = getTerrainDefenseStars(attacker.getTile().type);
          return 100 + 10 * terrainStars;
        }
      },
    },
  },
  powers: {
    COPower: {
      name: "Terrain Tactics",
      stars: 4,
      description: "All terrain movement cost is reduced to 1 (doesn't apply in snow).",
      hooks: {
        movementCost: (_value, unit) => {
          if (unit.player.match.getCurrentWeather() !== "snow") {
            return 1;
          }
        },
      },
    },
    superCOPower: {
      name: "Prime Tactics",
      stars: 7,
      description:
        "Terrain stars are doubled, and all terrain movement cost is reduced to 1 (doesn't apply in snow).",
      hooks: {
        // TODO if lash is the only CO using terrainStars hooks, maybe just inline it?
        // also check for the other hook types.
        terrainStars: (v) => v * 2,
        movementCost: (_value, unit) => {
          if (unit.player.match.getCurrentWeather() !== "snow") {
            return 1;
          }
        },
        // needs a "redefinition" because bonus terrain stars is calculated after the firepower bonuses
        attack({ attacker }) {
          if (attacker.properties.facility !== "airport") {
            const terrainStars = getTerrainDefenseStars(attacker.getTile().type);
            return 100 + 20 * terrainStars;
          }
        },
      },
    },
  },
};
