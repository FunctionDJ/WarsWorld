import type { UnitWithVisibleStats, Visibility, WWUnit } from "shared/schemas/unit";
import type { PlayerInMatch } from "shared/types/server-match-state";
import type { MutableMatch } from "../match/mutable-match";
import type { MutableTeam } from "../team/mutable-team";
import { MutableUnit } from "../unit/mutable-unit";
import type { UnitWrapper } from "../unit/unit";
import { PlayerInMatchWrapper } from "./player-in-match";

export class MutablePlayerInMatch<
  TVisibility extends Visibility = Visibility,
> extends PlayerInMatchWrapper<TVisibility> {
  public readonly match: MutableMatch;

  constructor(
    readonly data: PlayerInMatch,
    readonly team: MutableTeam,
  ) {
    super(data, team);
    this.match = team.match;
  }

  gainPowerCharge(value: number): void {
    if (this.data.COPowerState !== "no-power") {
      return;
    }

    this.data.powerMeter = Math.min(value, this.getMaxPowerMeter());
  }

  // TODO i don't really understand yet why WWUnit isn't compatible with
  // Omit<UnitWithVisibleStats, "playerSlot"> by default,
  // which is why it's currently explicitly listed.
  addUnwrappedUnit(
    rawUnit: Omit<UnitWithVisibleStats, "playerSlot"> | WWUnit,
  ): UnitWrapper<TVisibility> {
    const unit = new MutableUnit<TVisibility>(
      { ...rawUnit, playerSlot: this.data.slot },
      this.match,
    );

    this.match.units.push(unit);
    this.team.vision?.addUnitVision(unit);
    return unit;
  }

  getUnits(): MutableUnit<TVisibility>[] {
    return this.match.units.filter((unit) => this.owns(unit));
  }

  /**
   * gets the next player, looping back around to index 0
   * if needed until current player slot.
   * cant be readonly.
   */
  getNextAlivePlayer(): MutablePlayerInMatch | undefined {
    const nextSlot = (n: number): number => (n + 1) % this.match.map.data.numberOfPlayers;

    for (let index = nextSlot(this.data.slot); index !== this.data.slot; index = nextSlot(index)) {
      const player = this.match.getPlayerBySlot(index);

      if (player?.data.status === "alive") {
        return player;
      }
    }
  }
}
