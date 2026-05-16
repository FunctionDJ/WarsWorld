import { DispatchableError, InvalidStateError } from "shared/errors";
import type { AbilityEvent } from "shared/events";
import type { AbilityAction } from "shared/schemas/action";
import type { MatchWrapper } from "shared/wrappers/match";
import type { Unit } from "shared/wrappers/unit";
import type { ApplySubEvent, SubActionToEvent } from "../../handler-types";

// TODO infantry ability is missing missile / unusedSilo launch (!)
// the unusedSilo must be removed from the changeable/positionedTiles from the match after use
// and i don't know yet how the game's supposed to handle that the below tile becomes a usedSilo afterwards.

function willCaptureTile(unit: Unit): boolean {
  const tile = unit.getTile();

  if (!("hp" in tile)) {
    throw new InvalidStateError("Tile doesn't have HP");
  }

  if (unit.player.data.coId.name === "sami") {
    if (unit.player.data.COPowerState === "super-co-power") {
      return true;
    }

    return tile.hp - Math.floor(unit.getVisualHP() * 1.5) <= 0;
  }

  return tile.hp - unit.getVisualHP() <= 0;
}

function infantryOrMechAbilityToEvent(match: MatchWrapper, unit: Unit): AbilityEvent {
  const capturingTile = unit.getTile();

  // TODO: bugs out, tile is already captured when this triggers so it always believes property cannot be captured
  if (!("playerSlot" in capturingTile) /* || unit.player.owns(capturingTile)*/) {
    throw new DispatchableError("This tile can not be captured");
  }

  const basicEvent: AbilityEvent = {
    type: "ability",
  };

  //Will not capture property
  if (!willCaptureTile(unit)) {
    return basicEvent;
  }

  const currentPlayerPropertiesBeforeCapture = match.changeableTiles.filter((tile) =>
    unit.player.owns(tile),
  );

  if (currentPlayerPropertiesBeforeCapture.length + 1 >= match.rules.captureLimit) {
    return {
      ...basicEvent,
      eliminationReason: "property-goal-reached",
    };
  }

  const previousOwner = match.getPlayerBySlot(capturingTile.playerSlot, "dont-throw");

  if (previousOwner === undefined) {
    return basicEvent; // should only happen when capturing tiles owned by neutral (slot = -1)
  }

  const previousOwnerPropertiesBeforeCapture = match.changeableTiles.filter((tile) =>
    previousOwner.owns(tile),
  );

  const previousOwnerHasNoHQ = !previousOwnerPropertiesBeforeCapture.some(
    (tile) => tile.type === "hq",
  );

  const previousOwnerLabs = previousOwnerPropertiesBeforeCapture.filter(
    (tile) => tile.type === "lab",
  );

  const previousOwnerIsEliminated =
    capturingTile.type === "hq" ||
    (previousOwnerHasNoHQ && capturingTile.type === "lab" && previousOwnerLabs.length <= 1);

  if (previousOwnerIsEliminated) {
    return {
      ...basicEvent,
      eliminationReason: "hq-or-labs-captured",
    };
  }

  return basicEvent;
}

/* TODO transfer property ownership on HQ capture */

//Capture, APC supply, black bomb explosion, toggle stealth/sub hide.
export const abilityActionToEvent: SubActionToEvent<AbilityAction> = (
  match,
  action,
  fromPosition,
) => {
  const player = match.getCurrentTurnPlayer();
  const unit = match.getUnit(fromPosition);
  player.ownsOrThrow(unit);

  if (unit.isInfantryOrMech()) {
    return infantryOrMechAbilityToEvent(match, unit);
  }

  switch (unit.data.type) {
    case "apc":
    case "blackBomb":
    case "stealth":
    case "sub": {
      break;
    }
    default: {
      throw new DispatchableError("This unit does not have an ability");
    }
  }

  return action;
};

const eliminatePlayerByCapture = (match: MatchWrapper, capturingUnit: Unit): void => {
  const capturedTile = capturingUnit.getTile();

  if (!("playerSlot" in capturedTile)) {
    throw new InvalidStateError("Tile is not capturable");
  }

  const playerToEliminate = match.getPlayerBySlot(capturedTile.playerSlot);
  const newOwnerSlot = capturingUnit.data.playerSlot;

  for (const changeableTile of match.changeableTiles) {
    if ("playerSlot" in changeableTile && playerToEliminate.owns(changeableTile)) {
      changeableTile.playerSlot = newOwnerSlot;
    }
  }

  for (const unit of playerToEliminate.getUnits()) {
    unit.remove();
  }

  playerToEliminate.data.status = "captured";

  if (match.playerToRemoveWeatherEffect?.data.id === playerToEliminate.data.id) {
    match.playerToRemoveWeatherEffect = playerToEliminate.getNextAlivePlayer();
  }

  // TODO what happens with olaf snow and other CO powers?
};

export const applyAbilityEvent: ApplySubEvent<AbilityEvent> = (match, event, fromPosition) => {
  const unit = match.getUnit(fromPosition);

  switch (unit.data.type) {
    case "infantry":
    case "mech": {
      //capture tile

      if (event.eliminationReason === "hq-or-labs-captured") {
        eliminatePlayerByCapture(match, unit);
        break;
      }

      if (unit.data.hp === "sonja-hidden") {
        break;
      }

      const tile = unit.getTile();

      if (!("hp" in tile)) {
        throw new InvalidStateError("Tile doesn't have HP");
      }

      //TODO: For some reason, if the unit completes the capture, this function will run twice, therefore, this check is necessary to stop that
      if (!("playerSlot" in tile) || unit.player.owns(tile)) {
        tile.hp = 20;
        break;
      }

      let captureComplete: boolean;

      if (unit.player.data.coId.name === "sami") {
        if (unit.player.data.COPowerState === "super-co-power") {
          captureComplete = true; // insta capture
        } else {
          // capture at 1.5x rate, rounded down
          tile.hp -= Math.floor(unit.getVisualHP() * 1.5);
          captureComplete = tile.hp <= 0;
        }
      } else {
        tile.hp -= unit.getVisualHP();
        captureComplete = tile.hp <= 0;
      }

      if (captureComplete) {
        // finished capturing
        tile.hp = 20;

        if (!("playerSlot" in tile)) {
          throw new Error(
            `Could not capture tile at ${JSON.stringify(
              unit.data.position,
            )}: no playerSlot property! (Not changeable tile?)`,
          );
        }

        match.getPlayerBySlot(tile.playerSlot).team.vision?.removeOwnedProperty(unit.data.position);
        tile.playerSlot = unit.data.playerSlot;
        unit.player.team.vision?.addOwnedProperty(unit.data.position);
      }

      break;
    }
    case "apc": {
      for (const neighbour of unit.getNeighbouringUnits().filter((u) => unit.player.owns(u))) {
        neighbour.resupply();
      }

      break;
    }
    case "blackBomb": {
      match.damageUntil1HPInRadius({
        radius: 3,
        visualHpAmount: 5,
        epicenter: unit.data.position,
      });
      unit.remove();
      break;
    }
    case "stealth":
    case "sub": {
      //toggle hide
      unit.data.hiddenByAbility = !unit.data.hiddenByAbility;
      break;
    }
  }
};
