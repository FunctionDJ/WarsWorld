import type { Tile } from "shared/schemas/tile";
import type { PlayerInMatch } from "shared/server-match-state";
import type { Position } from "../schemas/position";
import type { MatchWrapper } from "./match";
import { PlayerInMatchWrapper } from "./player-in-match";
import type { Unit } from "./unit";
import { Vision } from "./vision";

export class Team {
  public readonly players: PlayerInMatchWrapper[];
  public vision?: Vision = undefined; // changes from undefined to vision to undefined when it rains / clear in awds

  constructor(
    players: readonly PlayerInMatch[],
    public readonly match: MatchWrapper,
    public readonly index: number,
  ) {
    this.players = players.map((p) => new PlayerInMatchWrapper(this, p));

    if (match.isFogOfWar()) {
      this.vision = new Vision(this);
    }
  }

  addUnwrappedPlayer(player: PlayerInMatch): PlayerInMatchWrapper {
    const playerWrapper = new PlayerInMatchWrapper(this, player);
    this.players.push(playerWrapper);
    return playerWrapper;
  }

  // TODO type predicate would be useful, but locks the false-branch into position being incorrectly typed as "undefined"
  isPositionVisible(position?: Position): boolean {
    if (this.match.isFogOfWar()) {
      if (position === undefined) {
        return false;
      }

      return this.vision?.isPositionVisible(position) ?? false;
    }

    // in clear weather all positions are visible
    return true;
  }

  getUnits(): readonly Unit[] {
    return this.players.flatMap((player) => player.getUnits());
  }

  getEnemyUnits(): readonly Unit[] {
    return this.match.units.filter((unit) => !this.owns(unit));
  }

  owns(tileOrUnit: Tile | Unit): boolean {
    return this.players.some((player) => player.owns(tileOrUnit));
  }

  canSeeUnitAtPosition(position: Position): boolean {
    const tile = this.match.getTile(position);
    const unit = this.match.getUnit(position, "dont-throw");

    if (unit === undefined) {
      return false; //no unit in specified position
    }

    if (this.owns(unit)) {
      return true;
    }

    if ("playerSlot" in tile && this.owns(tile)) {
      return true; // on top of allied property
    }

    // sub or stealth ability
    if (unit.isHiddenByAbility()) {
      return unit.getNeighbouringUnits().some((neighbour) => this.owns(neighbour));
    }

    return this.isPositionVisible(unit.data.position);
  }

  getEnemyUnitsInVision(): readonly Unit[] {
    return this.getEnemyUnits().filter((enemy) => {
      const tile = enemy.getTile();

      // units hidden by ability (sub/stealth) also get revealed on owned properties
      if ("playerSlot" in tile && this.owns(tile)) {
        return true;
      }

      // sub or stealth ability
      if (enemy.isHiddenByAbility()) {
        return enemy.getNeighbouringUnits().some((unit) => this.owns(unit));
      }

      return this.isPositionVisible(enemy.data.position);
    });
  }
}
