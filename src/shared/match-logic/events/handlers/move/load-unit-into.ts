import {
  carrierLoadedUnitSchema,
  cruiserLoadedUnitSchema,
  infantryOrMechSchema,
  landerLoadedUnitSchema,
  type UnitWithVisibleStats,
} from "shared/schemas/unit";
import type { RO } from "shared/types/ww-readonly";

export const loadUnitInto = (
  unitToLoad: RO<UnitWithVisibleStats>,
  transportUnit: UnitWithVisibleStats,
): void => {
  switch (transportUnit.type) {
    case "transportCopter":
    case "apc": {
      const loadable = infantryOrMechSchema.safeParse(unitToLoad);

      if (loadable.success) {
        transportUnit.loadedUnit = loadable.data;
      }

      break;
    }
    case "blackBoat": {
      const loadable = infantryOrMechSchema.safeParse(unitToLoad);

      if (loadable.success) {
        if (transportUnit.loadedUnit === undefined) {
          transportUnit.loadedUnit = loadable.data;
        } else {
          transportUnit.loadedUnit2 = loadable.data;
        }
      }

      break;
    }
    case "lander": {
      const loadable = landerLoadedUnitSchema.safeParse(unitToLoad);

      if (loadable.success) {
        if (transportUnit.loadedUnit === undefined) {
          transportUnit.loadedUnit = loadable.data;
        } else {
          transportUnit.loadedUnit2 = loadable.data;
        }
      }

      break;
    }
    case "cruiser": {
      const loadable = cruiserLoadedUnitSchema.safeParse(unitToLoad);

      if (loadable.success) {
        if (transportUnit.loadedUnit === undefined) {
          transportUnit.loadedUnit = loadable.data;
        } else {
          transportUnit.loadedUnit2 = loadable.data;
        }
      }

      break;
    }
    case "carrier": {
      const loadable = carrierLoadedUnitSchema.safeParse(unitToLoad);

      if (loadable.success) {
        if (transportUnit.loadedUnit === undefined) {
          transportUnit.loadedUnit = loadable.data;
        } else {
          transportUnit.loadedUnit2 = loadable.data;
        }
      }
    }
  }
};
