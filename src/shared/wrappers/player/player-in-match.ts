import { DispatchableError } from "shared/dispatchable-error";
import type { COPowerState } from "shared/match-logic/co";
import { getCOProperties } from "shared/match-logic/co";
import type { Hooks } from "shared/match-logic/co-hooks";
import type { CO } from "shared/schemas/co";
import type { GameVersion } from "shared/schemas/game-version";
import type { PassableTile } from "shared/schemas/tile";
import type { Visibility } from "shared/schemas/unit";
import type { ChangeableTile, PlayerInMatch } from "shared/types/server-match-state";
import type { WWReadOnly } from "shared/types/ww-readonly";
import {
  versionPropertiesMap,
  type VersionProperties,
} from "../../match-logic/game-constants/version-properties";
import type { MatchWrapper } from "../match/match";
import type { Team } from "../team/team";
import type { UnitWrapper } from "../unit/unit";

export class PlayerInMatchWrapper<TVisibility extends Visibility = Visibility> {
  public readonly match: MatchWrapper;

  constructor(
    public readonly data: WWReadOnly<PlayerInMatch>,
    public readonly team: Team,
  ) {
    this.match = team.match;
  }

  /**
   * returns amount of commtowers owned * 10 (since 1 commtower gives 10% attack boost)
   */
  getCommtowerAttackBoost(): number {
    const ownedCommtowers = this.match.changeableTiles.filter(
      (tile) => tile.type === "commtower" && this.owns(tile),
    );
    return ownedCommtowers.length * 10;
  }

  hasLab(): boolean {
    return this.match.changeableTiles.some((tile) => tile.type === "lab" && this.owns(tile));
  }

  getUnits(): UnitWrapper<TVisibility>[] {
    return this.match.units.filter((unit) => this.owns(unit));
  }

  getHook<HookType extends keyof Hooks>(hookType: HookType): Hooks[HookType] | undefined {
    const COProperties = getCOProperties(this.data.coId);

    switch (this.data.COPowerState) {
      case "no-power": {
        return COProperties.dayToDay?.hooks[hookType];
      }
      case "co-power": {
        return COProperties.powers.COPower?.hooks?.[hookType];
      }
      case "super-co-power": {
        return COProperties.powers.superCOPower?.hooks?.[hookType];
      }
    }
  }

  getVersionProperties(): VersionProperties {
    return versionPropertiesMap[this.match.rules.gameVersion ?? this.data.coId.version];
  }

  /**
   * gets the next player, looping back around to index 0
   * if needed until current player slot.
   */
  getNextAlivePlayer(): PlayerInMatchWrapper {
    const nextSlot = (n: number): number => (n + 1) % this.match.map.data.numberOfPlayers;

    for (let index = nextSlot(this.data.slot); index !== this.data.slot; index = nextSlot(index)) {
      const player = this.match.getPlayerBySlot(index);

      if (player.data.status === "alive") {
        return player;
      }
    }

    throw new DispatchableError("No next alive player");
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

  owns(tileOrUnit: PassableTile | WWReadOnly<ChangeableTile> | UnitWrapper): boolean {
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
  ownsOrThrow(tileOrUnit: PassableTile | WWReadOnly<ChangeableTile> | UnitWrapper): void {
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
