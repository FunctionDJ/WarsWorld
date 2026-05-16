/* eslint-disable max-lines */
import { IllegalActionError, InvalidStateError } from "shared/errors";
import { getVisualHP } from "shared/get-visual-hp";
import { unitPropertiesMap } from "shared/match-logic/game-constants/unit-properties";
import type { UnitProperties } from "shared/match-logic/game-constants/unit-properties-utilities";
import { clamp } from "shared/math-utilities";
import type { Direction } from "shared/schemas/direction";
import type { Position } from "shared/schemas/position";
import type { Tile } from "shared/schemas/tile";
import type { UnitData } from "shared/schemas/unit-schemas";
import { safeRemoveFromArray, throwIfUndefined } from "shared/throw-helper";
import { getBaseMovementCost } from "../match-logic/movement-cost";
import { getWeatherSpecialMovement } from "../match-logic/weather";
import type { PlayerInMatchWrapper } from "./player-in-match";

export class Unit {
  public readonly properties: UnitProperties;

  constructor(
    public readonly player: PlayerInMatchWrapper,
    public readonly data: UnitData,
  ) {
    this.properties = unitPropertiesMap[data.type];
  }

  /**
   * subs or stealths
   */
  isHiddenByAbility(): boolean {
    return "hiddenByAbility" in this.data && this.data.hiddenByAbility;
  }

  getFuel(): number {
    return this.data.fuel;
  }

  /**
   * returning `undefined` means this unit doesn't use ammo
   */
  getAmmo(): number | undefined {
    if (!("ammo" in this.data)) {
      return;
    }

    return this.data.ammo;
  }

  /** 1-10, whole numbers */
  getVisualHP(): number {
    return getVisualHP(this.data.hp);
  }

  getTile(): Tile {
    return this.player.match.getTile(this.data.position);
  }

  getNeighbouringUnits(): readonly Unit[] {
    const neighbourPositions = this.data.position.getNeighbours();

    return this.player.match.units.filter((unit) =>
      neighbourPositions.some((p) => p.isSame(unit.data.position)),
    );
  }

  // TODO checking fuel twice?
  getMovementPoints(): number {
    const { movementPoints } = this.properties;
    const movementPointsHook = this.player.getHook("movementPoints");
    const modifiedMovement = movementPointsHook?.(movementPoints, this) ?? movementPoints;
    return Math.min(modifiedMovement, this.data.fuel);
  }

  /**
   * returns the amount of movement points which must be spent to *enter* the tile
   * `undefined` means impassible terrain.
   */
  getMovementCost(position: Position): number | undefined {
    const baseMovementCost = getBaseMovementCost(
      unitPropertiesMap[this.data.type].movementType,
      getWeatherSpecialMovement(this.player),
      this.player.match.getTile(position).type,
      this.player.match.rules.gameVersion ?? this.player.data.coId.version,
    );

    if (baseMovementCost === undefined) {
      return;
    }

    return this.player.getHook("movementCost")?.(baseMovementCost, this) ?? baseMovementCost;
  }

  getBuildCost(): number {
    const { cost: baseCost } = this.properties;
    const hook = this.player.getHook("buildCost");
    return hook?.(baseCost, this.player.match) ?? baseCost;
  }

  isIndirect(): boolean {
    if (!("attackRange" in this.properties)) {
      return false;
    }

    return this.properties.attackRange[1] > 1;
  }

  /** @throws {IllegalActionError} */
  getAttackRange(): { minRange: number; maxRange: number } {
    const unitProperties = unitPropertiesMap[this.data.type];

    if (!("attackRange" in unitProperties)) {
      throw new IllegalActionError("Unit cannot attack");
    }

    let maximumAttackRange =
      unitProperties.attackRange[1] -
      (this.player.match.getCurrentWeather() === "sandstorm" ? 1 : 0);

    maximumAttackRange =
      this.player.getHook("attackRange")?.(maximumAttackRange, this) ?? maximumAttackRange;

    // we'll need this logic to prevent e.g. Max from having
    // [2, 1] (invalid) artillery attack range in sandstorms.
    maximumAttackRange = Math.max(unitProperties.attackRange[0], maximumAttackRange);

    return { minRange: unitProperties.attackRange[0], maxRange: maximumAttackRange };
  }

  isInfantryOrMech(): boolean {
    return this.data.type === "infantry" || this.data.type === "mech";
  }

  isTransport(): boolean {
    return ["apc", "lander", "blackBoat", "carrier", "transportCopter", "cruiser"].includes(
      this.data.type,
    );
  }

  /**
   * doesn't check for fuel or move range, just checks if current tile/position
   * is passable (relevant for e.g. transports) and if destination tile is passable.
   * as of writing only used by unload logic.
   */
  canMoveTo(position: Position): boolean {
    /**
     * units can't move to a position if their baseMovementCost
     * is undefined for the destination AND their current position.
     * current position / origin is relevant for e.g. loaded units in transports.
     */

    const baseMovementCostOrigin = getBaseMovementCost(
      this.properties.movementType,
      getWeatherSpecialMovement(this.player),
      this.player.match.getTile(this.data.position).type,
      this.player.match.rules.gameVersion ?? this.player.data.coId.version,
    );

    if (baseMovementCostOrigin === undefined) {
      return false;
    }

    const baseMovementCostDestination = getBaseMovementCost(
      this.properties.movementType,
      getWeatherSpecialMovement(this.player),
      this.player.match.getTile(position).type,
      this.player.match.rules.gameVersion ?? this.player.data.coId.version,
    );

    return baseMovementCostDestination !== undefined;
  }

  setFuel(newFuel: number): void {
    this.data.fuel = clamp(0, newFuel, this.properties.initialFuel);
  }

  drainFuel(fuelAmount: number): void {
    this.setFuel(this.data.fuel - fuelAmount);
  }

  setAmmo(newAmmo: number): void {
    if (!("ammo" in this.data) || !("initialAmmo" in this.properties)) {
      return;
    }

    this.data.ammo = clamp(0, newAmmo, this.properties.initialAmmo);
  }

  // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
  useOneAmmo(): void {
    this.setAmmo((this.getAmmo() ?? 1) - 1);
  }

  resupply(): void {
    this.setFuel(this.properties.initialFuel);

    if ("initialAmmo" in this.properties) {
      this.setAmmo(this.properties.initialAmmo);
    }
  }

  /**
   * IMPORTANT!
   * Param is VISUAL hp, since all sources of damaging without killing
   * are "multiples of 10" (nothing does 25 damage, for example)
   */
  damageUntil1HP(visualHpAmount: number): void {
    if (this.data.hp === "sonja-hidden") {
      return;
    }

    this.data.hp = Math.max(1, this.data.hp - visualHpAmount * 10);
  }

  /**
   * IMPORTANT!
   * Param is VISUAL hp, since all sources of healing round the up to
   * the highest "real" hp that corresponds to the resulting visual hp.
   */
  heal(visualHpAmount: number): void {
    if (this.data.hp === "sonja-hidden") {
      return;
    }

    const newVisualHP = this.getVisualHP() + visualHpAmount;
    this.data.hp = Math.min(10, newVisualHP) * 10;
  }

  /**
   * Unit WILL die if hp is set to 0
   */
  setHp(newPreciseHp: number): void {
    if (this.data.hp === "sonja-hidden") {
      return;
    }

    this.data.hp = Math.max(0, Math.min(100, newPreciseHp));

    if (this.data.hp === 0) {
      this.remove();
    }
  }

  /**
   * used by at least the "destroy" action
   */
  remove(): void {
    this.player.team.vision?.removeUnitVision(this);

    // TODO maybe `u => u === this` could work ..?
    safeRemoveFromArray(this.player.match.units, (u) => u.data.position.isSame(this.data.position));
  }

  getLoadedUnit(slot: 1 | 2): Unit {
    if (!("loadedUnits" in this.data)) {
      throw new InvalidStateError("Not a transport");
    }

    if (slot === 1) {
      return new Unit(this.player, {
        ...throwIfUndefined(this.data.loadedUnits[0]),
        playerSlot: this.data.playerSlot,
        isReady: false,
        position: this.data.position,
      });
    }

    return new Unit(this.player, {
      ...throwIfUndefined(this.data.loadedUnits[1]),
      playerSlot: this.data.playerSlot,
      isReady: false,
      position: this.data.position,
    });
  }

  unload({ slot, direction }: Readonly<{ slot: 1 | 2; direction: Direction }>): void {
    if (!("loadedUnits" in this.data)) {
      throw new InvalidStateError("Not a transport");
    }

    const loadedUnitData = this.getLoadedUnit(slot).data;

    this.player.addUnwrappedUnit({
      ...loadedUnitData,
      position: this.data.position.addDirection(direction),
    });

    if (this.data.loadedUnits.length === 1) {
      this.data.loadedUnits[0] = undefined;
    } else {
      if (slot === 1) {
        // move loaded unit 2 to slot 1
        // eslint-disable-next-line @typescript-eslint/prefer-destructuring
        this.data.loadedUnits[0] = this.data.loadedUnits[1];
        this.data.loadedUnits[1] = undefined;
      } else {
        this.data.loadedUnits[1] = undefined;
      }
    }
  }

  getVisionRange(): number {
    const { vision: baseVision } = unitPropertiesMap[this.data.type];
    const hasMountainBonus = this.isInfantryOrMech() && this.getTile().type === "mountain";
    const modifiedVision = this.player.getHook("vision")?.(baseVision);
    const coVisionRange = (modifiedVision ?? baseVision) + (hasMountainBonus ? 3 : 0);

    const weatherVisionRange =
      this.player.match.getCurrentWeather() === "rain" ? coVisionRange - 1 : coVisionRange;

    return Math.max(weatherVisionRange, 0);
  }
}
