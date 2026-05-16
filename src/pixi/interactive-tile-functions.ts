import { Container } from "pixi.js";
import { calculateEngagementOutcome } from "shared/match-logic/calculate-damage";
import { createPipeSeamUnitEquivalent } from "shared/match-logic/game-constants/base-damage";
import type { Position } from "shared/schemas/position";
import type { MatchWrapper } from "shared/wrappers/match";
import type { Unit } from "shared/wrappers/unit";
import { tileConstructor } from "./sprite-constructor";

export interface BattleForecast {
  attackerDamage: { max: number; min: number };
  defenderDamage: { max: number; min: number };
}

export const getBattleForecast = (
  match: MatchWrapper,
  attacker: Unit,
  newUnitPosition: Position,
  attackingAtPosition: Position,
): BattleForecast => {
  let defender = match.getUnit(attackingAtPosition, "dont-throw");
  const isPipeSeamAttack = defender === undefined;

  if (!defender) {
    const attackedTile = match.getTile(attackingAtPosition);

    if (attackedTile.type == "pipeSeam") {
      defender = createPipeSeamUnitEquivalent(attacker, attackingAtPosition, attackedTile.hp);
    } else {
      throw Error(
        "Creating attackable tile functionality to a tile that does not have a unit / pipeseam",
      );
    }
  }

  //temporarily move newUnit to new position (WON'T CHECK VALIDITY!)
  const oldUnitPosition = attacker.data.position;
  attacker.data.position = newUnitPosition;

  const bestAttackerOutcome = isPipeSeamAttack
    ? calculateEngagementOutcome(
        attacker,
        defender,
        { goodLuck: 0, badLuck: 0 },
        { goodLuck: 0, badLuck: 0 },
      )
    : calculateEngagementOutcome(
        attacker,
        defender,
        { goodLuck: 1, badLuck: 0 },
        { goodLuck: 0, badLuck: 1 },
      );

  const bestDefenderOutcome = isPipeSeamAttack
    ? calculateEngagementOutcome(
        attacker,
        defender,
        { goodLuck: 0, badLuck: 0 },
        { goodLuck: 0, badLuck: 0 },
      )
    : calculateEngagementOutcome(
        attacker,
        defender,
        { goodLuck: 0, badLuck: 1 },
        { goodLuck: 1, badLuck: 0 },
      );

  attacker.data.position = oldUnitPosition;
  const attackerHP = attacker.data.hp === "sonja-hidden" ? 100 : attacker.data.hp;
  const defenderHP = defender.data.hp === "sonja-hidden" ? 100 : defender.data.hp;

  //create display of engagement result
  const maxDamageDealt = defenderHP - bestAttackerOutcome.defenderHP;
  const minDamageDealt = defenderHP - bestDefenderOutcome.defenderHP;
  const maxDamageTaken = attackerHP - (bestDefenderOutcome.attackerHP ?? attackerHP);
  const minDamageTaken = attackerHP - (bestAttackerOutcome.attackerHP ?? attackerHP);

  //Enemy unit is dead or can't attack
  if (minDamageDealt >= defenderHP || maxDamageTaken === attackerHP) {
    return {
      attackerDamage: { max: maxDamageDealt, min: minDamageDealt },
      defenderDamage: { min: 0, max: 0 },
    };
  }

  return {
    attackerDamage: { max: maxDamageDealt, min: minDamageDealt },
    defenderDamage: { min: minDamageTaken, max: maxDamageTaken },
  };
};

//passable tiles colour: "#43d9e4"
//attackable tiles colour: "#be1919"
export const createTilesContainer = (
  tilePositions: Position[],
  tileColour: string,
  tileZIndex: number,
  containerName?: string,
) => {
  const markedTiles = new Container();
  markedTiles.eventMode = "dynamic";

  for (const pos of tilePositions) {
    const square = tileConstructor(pos, tileColour);

    markedTiles.addChild(square);
  }

  markedTiles.zIndex = tileZIndex;

  if (containerName !== undefined) {
    markedTiles.name = containerName;
  }

  return markedTiles;
};
