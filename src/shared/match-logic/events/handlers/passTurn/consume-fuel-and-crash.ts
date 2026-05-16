import type { Unit } from "shared/wrappers/unit";

const baseAirport = (unit: Unit): number => {
  if (unit.isHiddenByAbility()) {
    return 8;
  }

  return unit.data.type.includes("Copter") ? 2 : 5;
};

export function getTurnFuelConsumption(unit: Unit): number {
  switch (unit.properties.facility) {
    case "airport": {
      return unit.player.data.coId.name === "eagle" ? baseAirport(unit) - 2 : baseAirport(unit);
    }
    case "port": {
      return unit.isHiddenByAbility() ? 5 : 1;
    }
    default: {
      return 0;
    }
  }
}
