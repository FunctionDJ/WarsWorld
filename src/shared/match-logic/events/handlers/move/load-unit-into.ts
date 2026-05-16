import {
  carrierLoadedUnitSchema,
  cruiserLoadedUnitSchema,
  landerLoadedUnitSchema,
  type UnitData,
} from "shared/schemas/unit-schemas";
import type { RO } from "shared/ww-readonly";

export const loadUnitInto = (unitToLoad: RO<UnitData>, transportUnit: UnitData): void => {
  switch (transportUnit.type) {
    case "transportCopter":
    case "apc": {
      if (unitToLoad.type === "infantry" || unitToLoad.type === "mech") {
        transportUnit.loadedUnits = [unitToLoad];
      }

      break;
    }
    case "blackBoat": {
      if (unitToLoad.type === "infantry" || unitToLoad.type === "mech") {
        if (transportUnit.loadedUnits[0] === undefined) {
          transportUnit.loadedUnits[0] = unitToLoad;
        } else {
          transportUnit.loadedUnits[1] = unitToLoad;
        }
      }

      break;
    }
    case "lander": {
      const loadable = landerLoadedUnitSchema.safeParse(unitToLoad);

      if (loadable.success) {
        if (transportUnit.loadedUnits[0] === undefined) {
          transportUnit.loadedUnits[0] = loadable.data;
        } else {
          transportUnit.loadedUnits[1] = loadable.data;
        }
      }

      break;
    }
    case "cruiser": {
      const loadable = cruiserLoadedUnitSchema.safeParse(unitToLoad);

      if (loadable.success) {
        if (transportUnit.loadedUnits[0] === undefined) {
          transportUnit.loadedUnits[0] = loadable.data;
        } else {
          transportUnit.loadedUnits[1] = loadable.data;
        }
      }

      break;
    }
    case "carrier": {
      const loadable = carrierLoadedUnitSchema.safeParse(unitToLoad);

      if (loadable.success) {
        if (transportUnit.loadedUnits[0] === undefined) {
          transportUnit.loadedUnits[0] = loadable.data;
        } else {
          transportUnit.loadedUnits[1] = loadable.data;
        }
      }
    }
  }
};
