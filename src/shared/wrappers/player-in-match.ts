import { DispatchableError } from "shared/DispatchedError";
import type { COPowerState } from "shared/match-logic/co";
import { getCOProperties } from "shared/match-logic/co";
import type { Hooks } from "shared/match-logic/co-hooks";
import type { CO } from "shared/schemas/co";
import type { GameVersion } from "shared/schemas/game-version";
import type { Tile } from "shared/schemas/tile";
import type { UnitWithVisibleStats, WWUnit } from "shared/schemas/unit";
import type { ChangeableTile, PlayerInMatch } from "shared/types/server-match-state";
import {
  versionPropertiesMap,
  type VersionProperties,
} from "../match-logic/game-constants/version-properties";
import type { MatchWrapper } from "./match";
import type { TeamWrapper } from "./team";
import { UnitWrapper } from "./unit";

export class PlayerInMatchWrapper {
  public match: MatchWrapper;

  constructor(
    public data: PlayerInMatch,
    public team: TeamWrapper,
  ) {
    this.match = team.match;
  }

  /**
   * returns amount of commtowers owned * 10 (since 1 commtower gives 10% attack boost)
   */
  getCommtowerAttackBoost(): number {
    return (
      10 *
      this.match.changeableTiles.reduce(
        (prev, cur) =>
          cur.type === "commtower" && cur.playerSlot === this.data.slot ? prev + 1 : prev,
        0,
      )
    );
  }

  hasLab(): boolean {
    return (
      this.match.changeableTiles.find(
        (tile) => tile.type === "lab" && tile.playerSlot === this.data.slot,
      ) !== undefined
    );
  }

  getUnits(): UnitWrapper[] {
    return this.match.units.filter((u) => u.data.playerSlot === this.data.slot);
  }

  getHook<HookType extends keyof Hooks>(hookType: HookType): Hooks[HookType] | undefined {
    const COProperties = getCOProperties(this.data.coId);

    switch (this.data.COPowerState) {
      case "no-power":
        return COProperties.dayToDay?.hooks[hookType];
      case "co-power":
        return COProperties.powers.COPower?.hooks?.[hookType];
      case "super-co-power":
        return COProperties.powers.superCOPower?.hooks?.[hookType];
    }
  }

  getVersionProperties(): VersionProperties {
    return versionPropertiesMap[this.match.rules.gameVersion ?? this.data.coId.version];
  }

  /**
   * gets the next player, looping back around to index 0
   * if needed until current player slot.
   */
  getNextAlivePlayer(): PlayerInMatchWrapper | null {
    const nextSlot = (n: number): number => (n + 1) % this.match.map.data.numberOfPlayers;

    for (let i = nextSlot(this.data.slot); i !== this.data.slot; i = nextSlot(i)) {
      const player = this.match.getPlayerBySlot(i);

      if (player?.data.status === "alive") {
        return player;
      }
    }

    return null;
  }

  getPowerStarCost(): number {
    const versionProperties = this.getVersionProperties();
    return (
      versionProperties.baseStarValue *
      (1 + versionProperties.powerMeterScaling * Math.min(this.data.timesPowerUsed, 10))
    );
  }

  getMaxPowerMeter(): number {
    const COPowers = getCOProperties(this.data.coId).powers;

    if (COPowers.superCOPower !== undefined) {
      return COPowers.superCOPower.stars * this.getPowerStarCost();
    }

    if (COPowers.COPower !== undefined) {
      return COPowers.COPower.stars * this.getPowerStarCost();
    }

    return 0;
  }

  gainPowerCharge(value: number): void {
    if (this.data.COPowerState !== "no-power") {
      return;
    }

    this.data.powerMeter = Math.min(value, this.getMaxPowerMeter());
  }

  owns(tileOrUnit: Tile | ChangeableTile | UnitWrapper): boolean {
    if ("playerSlot" in tileOrUnit && tileOrUnit.playerSlot === this.data.slot) {
      return true;
    }

    if (
      "data" in tileOrUnit &&
      "playerSlot" in tileOrUnit.data &&
      tileOrUnit.data.playerSlot === this.data.slot
    ) {
      return true;
    }

    return false;
  }

  /** @throws {DispatchableError} */
  ownsOrThrow(tileOrUnit: Tile | ChangeableTile | UnitWrapper): void {
    if (!this.owns(tileOrUnit)) {
      throw new DispatchableError("Invalid action on tile or unit not owned by player");
    }
  }

  getFundsPerTurn(): number {
    let numberOfFundsGivingProperties = 0;

    for (const changeableTile of this.match.changeableTiles) {
      if (
        changeableTile.type !== "lab" &&
        changeableTile.type !== "commtower" &&
        this.owns(changeableTile)
      ) {
        numberOfFundsGivingProperties++;
      }
    }

    let { fundsPerProperty } = this.match.rules;

    if (this.data.coId.name === "sasha") {
      fundsPerProperty += 100;
    }

    return numberOfFundsGivingProperties * fundsPerProperty;
  }

  // TODO i don't really understand yet why WWUnit isn't compatible with
  // Omit<UnitWithVisibleStats, "playerSlot"> by default,
  // which is why it's currently explicitly listed.
  addUnwrappedUnit(rawUnit: Omit<UnitWithVisibleStats, "playerSlot"> | WWUnit): UnitWrapper {
    const unit = new UnitWrapper(
      { ...rawUnit, playerSlot: this.data.slot } as UnitWithVisibleStats,
      this.match,
    );

    this.match.units.push(unit);
    this.team.vision?.addUnitVision(unit);
    return unit;
  }

  /**
   * Check current power activated with optional CO constraints
   */
  isUsingPower(power: COPowerState, coName?: CO, coVersion?: GameVersion): boolean {
    if (power !== this.data.COPowerState) {
      return false;
    }

    if (coName && coName !== this.data.coId.name) {
      return false;
    }

    if (coVersion && coVersion !== this.data.coId.version) {
      return false;
    }

    return true;
  }
}
