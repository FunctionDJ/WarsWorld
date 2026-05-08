import { DispatchableError } from "shared/dispatchable-error";
import {
  createPipeSeamUnitEquivalent,
  getBaseDamage,
} from "shared/match-logic/game-constants/base-damage";
import { unitPropertiesMap } from "shared/match-logic/game-constants/unit-properties";
import { getBaseMovementCost } from "shared/match-logic/movement-cost";
import { getWeatherSpecialMovement } from "shared/match-logic/weather";
import type { SubAction } from "shared/schemas/action";
import { Position } from "shared/schemas/position";
import type { LoadedUnit } from "shared/schemas/unit";
import type { MatchWrapper } from "shared/wrappers/match/match";
import type { PlayerInMatchWrapper } from "shared/wrappers/player/player-in-match";
import type { UnitWrapper } from "shared/wrappers/unit/unit";

export enum AvailableSubActions {
  "Wait",
  "Join",
  "Load",
  "Capture",
  "Launch", //position handled after subaction selection
  "Supply",
  "Explode",
  "Hide",
  "Show",
  "Unload", //unit to unload and position handled after subaction selection
  "Repair", //unit to repair handled after subaction selection
  "Attack", //unit to attack handled after subaction selection
  "Delete", //has to be handled in a special way because it's not a subaction
}

export const getAvailableSubActions = (
  match: MatchWrapper,
  player: PlayerInMatchWrapper,
  unit: UnitWrapper,
  newPosition: Position,
  hasMoved: boolean,
): Map<AvailableSubActions, SubAction | undefined> => {
  const menuOptions: Map<AvailableSubActions, SubAction | undefined> = new Map<
    AvailableSubActions,
    SubAction | undefined
  >();
  const tile = match.getTile(newPosition);

  //This grabs the neighboring units in the new position, units.getNeighboringUnits() gets them in the old position
  const neighbourPositions = newPosition.getNeighbours();

  const neighbourUnitsInNewPosition = match.units.filter((unit) =>
    neighbourPositions.some((p) => unit.data.position.isSame(p)),
  );

  //check for wait / join / load (move validity
  // already checked somewhere else)
  //if loading / joining, there is only one menu option
  if (
    match.getUnit(newPosition, "dont-throw") === undefined ||
    newPosition.isSame(unit.data.position)
  ) {
    menuOptions.set(AvailableSubActions.Wait, { type: "wait" });
  } else if (match.getUnit(newPosition, "dont-throw")?.data.type === unit.data.type) {
    menuOptions.set(AvailableSubActions.Join, { type: "wait" });
    return menuOptions;
  } else {
    menuOptions.set(AvailableSubActions.Load, { type: "wait" });
    return menuOptions;
  }

  //check for attack, including pipeseams
  if (!unit.isTransport()) {
    let addAttackSubaction = false;

    const pipeSeamUnitEquivalent = createPipeSeamUnitEquivalent(match, unit);
    const canAttackPipeseams = getBaseDamage(unit, pipeSeamUnitEquivalent) !== undefined;

    if (unit.isIndirect() && !hasMoved) {
      for (let x = 0; x < match.map.width && !addAttackSubaction; x++) {
        for (let y = 0; y < match.map.height && !addAttackSubaction; y++) {
          const pos = new Position([x, y]);
          const distance = unit.data.position.getDistance(pos);

          if (
            distance <= unit.properties.attackRange[1] &&
            distance >= unit.properties.attackRange[0]
          ) {
            if (
              canAttackPipeseams &&
              !match.map.isOutOfBounds(pos) &&
              match.getTile(pos).type === "pipeSeam"
            ) {
              addAttackSubaction = true;
            }

            const attackableUnit = match.getUnit(pos, "dont-throw");

            if (
              attackableUnit &&
              attackableUnit.player.team !== unit.player.team &&
              getBaseDamage(unit, attackableUnit) !== undefined
            ) {
              addAttackSubaction = true;
            }
          }
        }
      }
    } else {
      if (canAttackPipeseams) {
        for (const adjacentPos of newPosition.getNeighbours()) {
          if (addAttackSubaction) {
            break;
          }

          if (
            !match.map.isOutOfBounds(adjacentPos) &&
            match.getTile(adjacentPos).type === "pipeSeam"
          ) {
            addAttackSubaction = true;
          }
        }
      }

      for (const adjacentUnit of neighbourUnitsInNewPosition) {
        if (addAttackSubaction) {
          break;
        }

        if (
          adjacentUnit.player.team !== unit.player.team &&
          getBaseDamage(unit, adjacentUnit) !== undefined
        ) {
          addAttackSubaction = true;
        }
      }
    }

    if (addAttackSubaction) {
      //handled later
      menuOptions.set(AvailableSubActions.Attack, undefined);
    }
  }

  //check for capture / launch
  if (unit.isInfantryOrMech()) {
    if ("playerSlot" in tile && tile.playerSlot !== player.data.slot) {
      menuOptions.set(AvailableSubActions.Capture, { type: "ability" });
    }

    if (tile.type === "unusedSilo" && "fired" in tile && !tile.fired) {
      //handled later
      menuOptions.set(AvailableSubActions.Launch, undefined);
    }
  }

  //check for supply
  if (unit.data.type === "apc") {
    for (const adjacentUnit of neighbourUnitsInNewPosition) {
      if (adjacentUnit.player.data.id === unit.player.data.id) {
        menuOptions.set(AvailableSubActions.Supply, { type: "ability" });
        break;
      }
    }
  }

  //check for explode
  if (unit.data.type === "blackBomb") {
    menuOptions.set(AvailableSubActions.Explode, { type: "ability" });
  }

  //check for hide / show
  if ("hidden" in unit.data) {
    if (unit.data.hidden) {
      menuOptions.set(AvailableSubActions.Show, { type: "ability" });
    } else {
      menuOptions.set(AvailableSubActions.Hide, { type: "ability" });
    }
  }

  //check for unload
  if (player.getVersionProperties().unloadOnlyAfterMove && unit.isTransport()) {
    if (tile.type === "pipeSeam") {
      throw new DispatchableError("Can't unload from pipe seam (this should be impossible)");
    }

    let addUnloadSubaction = false;

    const getAddUnloadSubaction = (unit: UnitWrapper, loadedUnit: LoadedUnit): boolean => {
      const baseMovementCost = getBaseMovementCost(
        unitPropertiesMap[loadedUnit.type].movementType,
        getWeatherSpecialMovement(unit.player),
        tile.type,
        match.rules.gameVersion ?? unit.player.data.coId.version,
      );

      if (baseMovementCost === undefined) {
        return false;
      }

      for (const adjacentPosition of newPosition.getNeighbours()) {
        if (match.map.isOutOfBounds(adjacentPosition)) {
          continue;
        }

        const adjacentTile = match.getTile(adjacentPosition);

        if (adjacentTile.type === "pipeSeam") {
          continue;
        }

        const adjacentBaseMovementCost = getBaseMovementCost(
          unitPropertiesMap[loadedUnit.type].movementType,
          getWeatherSpecialMovement(unit.player),
          adjacentTile.type,
          match.rules.gameVersion ?? unit.player.data.coId.version,
        );

        if (adjacentBaseMovementCost !== undefined) {
          return true;
        }
      }

      return false;
    };

    if (unit.data.loadedUnit !== undefined) {
      addUnloadSubaction = getAddUnloadSubaction(unit, unit.data.loadedUnit);
    }

    if (!addUnloadSubaction && "loadedUnit2" in unit.data && unit.data.loadedUnit2 !== undefined) {
      addUnloadSubaction = getAddUnloadSubaction(unit, unit.data.loadedUnit2);
    }

    if (addUnloadSubaction) {
      menuOptions.set(AvailableSubActions.Unload, undefined); //handled later
    }
  }

  //check for repair
  if (unit.data.type === "blackBoat") {
    for (const adjacentUnit of neighbourUnitsInNewPosition) {
      if (adjacentUnit.player.data.id === unit.player.data.id) {
        //available directions handled later
        menuOptions.set(AvailableSubActions.Repair, undefined);
        break;
      }
    }
  }

  //check for delete (technically not a subaction)
  if (!hasMoved) {
    menuOptions.set(AvailableSubActions.Delete, undefined);
  }

  return menuOptions;
};
