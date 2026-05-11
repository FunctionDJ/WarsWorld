import type { PassableTile } from "shared/schemas/tile";
import type { WWUnit } from "shared/schemas/unit";
import type { ChangeableTile, PlayerInMatch } from "shared/types/server-match-state";
import type { WWReadOnly } from "shared/types/ww-readonly";
import type { Position } from "../../schemas/position";
import type { MatchWrapper } from "../match/match";
import { PlayerInMatchWrapper } from "../player/player-in-match";
import type { UnitWrapper } from "../unit/unit";
import { Vision } from "../vision/vision";

export class Team {
  public readonly players: PlayerInMatchWrapper[];
  public vision?: Vision = undefined; // changes from undefined to vision to undefined when it rains / clear in awds

  constructor(
    players: PlayerInMatch[],
    public match: MatchWrapper,
    public index: number,
  ) {
    this.players = players.map((p) => new PlayerInMatchWrapper(p, this));

    if (match.isFogOfWar()) {
      this.vision = new Vision(this);
    }
  }

  // TODO type predicate would be useful, but locks the false-branch into position being incorrectly typed as "undefined"
  isPositionVisible(position?: Position): boolean {
    if (this.match.isFogOfWar()) {
      this.vision ??= new Vision(this); // vision being nullish here should never happen, but whatever
      return position !== undefined && this.vision.isPositionVisible(position);
    }

    // in clear weather all positions are visible
    return true;
  }

  getUnits(): UnitWrapper[] {
    return this.players.flatMap((player) => player.getUnits());
  }

  getEnemyUnits(): UnitWrapper[] {
    return this.match.units.filter((unit) => !this.owns(unit));
  }

  owns(tileOrUnit: PassableTile | WWReadOnly<ChangeableTile> | UnitWrapper): boolean {
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
    if ("hidden" in unit.data && unit.data.hidden) {
      return unit.getNeighbouringUnits().some((neighbour) => this.owns(neighbour));
    }

    return this.isPositionVisible(unit.data.position);
  }

  getEnemyUnitsInVision(): WWUnit[] {
    return this.getEnemyUnits()
      .filter((enemy) => {
        const tile = enemy.getTile();

        // units hidden by ability (sub/stealth) also get revealed on owned properties
        if ("playerSlot" in tile && this.owns(tile)) {
          return true;
        }

        // sub or stealth ability
        if ("hidden" in enemy.data && enemy.data.hidden) {
          return enemy.getNeighbouringUnits().some((unit) => this.owns(unit));
        }

        return this.isPositionVisible(enemy.data.position);
      })
      .map<WWUnit>((visibleEnemyUnit) => {
        if (visibleEnemyUnit.player.data.coId.name === "sonja") {
          return {
            ...visibleEnemyUnit.data,
            stats: "hidden",
          };
        }

        return visibleEnemyUnit.data;
      });
  }
}
