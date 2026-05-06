import { DispatchableError } from "shared/DispatchedError";
import { unitPropertiesMap } from "shared/match-logic/game-constants/unit-properties";
import { clamp } from "shared/math-utils";
import type { Direction } from "shared/schemas/direction";
import type { Position } from "shared/schemas/position";
import type { Tile } from "shared/schemas/tile";
import type { UnitType, WWUnit } from "shared/schemas/unit";
import type { ChangeableTile } from "shared/types/server-match-state";
import { getBaseMovementCost } from "../match-logic/movement-cost";
import { getWeatherSpecialMovement } from "../match-logic/weather";
import type { MatchWrapper } from "./match";
import type { PlayerInMatchWrapper } from "./player-in-match";

// TODO this ExtractUnit, double-generic situation is not great

export type ExtractUnit<T extends UnitType> = Extract<WWUnit, { type: T }>;

export class UnitWrapper<
  Type extends UnitType = UnitType,
  /**
   * we need this second generic to contract `Type` to `Unit` which is the type for `this.data`.
   * without this, issues arise when trying to assign `this` to `UnitWrapper` (without generic!)
   * like a lot of utility functions do.
   */
  Unit extends ExtractUnit<Type> = ExtractUnit<Type>,
> {
  public player: PlayerInMatchWrapper;

  public properties: (typeof unitPropertiesMap)[Type];

  constructor(
    public data: Unit,
    public match: MatchWrapper,
  ) {
    const player = match.getPlayerBySlot(data.playerSlot);

    if (player === undefined) {
      throw new Error(`Could not find player by slot ${String(data.playerSlot)}`);
    }

    this.player = player;
    this.properties = unitPropertiesMap[data.type];
  }

  // FUEL AND AMMO *************************************************************
  getFuel(): number {
    if (this.data.stats === "hidden") {
      return this.properties.initialFuel;
    }

    return this.data.stats.fuel;
  }

  setFuel(newFuel: number): void {
    if (this.data.stats === "hidden") {
      return;
    }

    this.data.stats.fuel = clamp(0, newFuel, this.properties.initialFuel);
  }

  drainFuel(fuelAmount: number): void {
    if (this.data.stats === "hidden") {
      // hidden can only be true on client
      return;
    }

    this.setFuel(this.data.stats.fuel - fuelAmount);
  }

  /**
   * returning `null` means this unit doesn't use ammo
   */
  getAmmo(): number | null {
    if (this.data.stats === "hidden") {
      return "initialAmmo" in this.properties ? this.properties.initialAmmo : null;
    }

    if (!("ammo" in this.data.stats)) {
      return null;
    }

    return this.data.stats.ammo;
  }

  setAmmo(newAmmo: number): void {
    if (
      this.data.stats === "hidden" ||
      !("ammo" in this.data.stats) ||
      !("initialAmmo" in this.properties)
    ) {
      return;
    }

    this.data.stats.ammo = clamp(0, newAmmo, this.properties.initialAmmo);
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

  // HP ************************************************************************
  getHP(): number {
    if (this.data.stats === "hidden") {
      return 100;
    }

    return this.data.stats.hp;
  }

  getVisualHP(): number {
    return Math.ceil(this.getHP() / 10);
  }

  /**
   * IMPORTANT!
   * Param is VISUAL hp, since all sources of damaging without killing
   * are "multiples of 10" (nothing does 25 damage, for example)
   */
  damageUntil1HP(visualHpAmount: number): void {
    if (this.data.stats === "hidden") {
      return;
    }

    this.data.stats.hp = Math.max(1, this.data.stats.hp - visualHpAmount * 10);
  }

  /**
   * IMPORTANT!
   * Param is VISUAL hp, since all sources of healing round the up to
   * the highest "real" hp that corresponds to the resulting visual hp.
   */
  heal(visualHpAmount: number): void {
    if (this.data.stats === "hidden") {
      return;
    }

    const newVisualHP = this.getVisualHP() + visualHpAmount;
    this.data.stats.hp = Math.min(10, newVisualHP) * 10;
  }

  /**
   * Unit WILL die if hp is set to 0
   */
  setHp(newPreciseHp: number): void {
    if (this.data.stats === "hidden") {
      return;
    }

    this.data.stats.hp = Math.max(0, Math.min(100, newPreciseHp));

    if (this.data.stats.hp === 0) {
      this.remove();
    }
  }

  // TILE AND MOVEMENT *********************************************************
  getTile(): Tile | ChangeableTile {
    return this.match.getTile(this.data.position);
  }

  getNeighbouringUnits(): UnitWrapper[] {
    const neighbourPositions = this.data.position.getNeighbours();

    return this.match.units.filter((unit) =>
      neighbourPositions.some((p) => p.isSame(unit.data.position)),
    );
  }

  /** TODO checking fuel twice? */
  getMovementPoints(): number {
    const { movementPoints, initialFuel } = this.properties;

    const movementPointsHook = this.player.getHook("movementPoints");
    const modifiedMovement = movementPointsHook?.(movementPoints, this) ?? movementPoints;

    const fuel = this.data.stats === "hidden" ? initialFuel : this.data.stats.fuel;

    return Math.min(modifiedMovement, fuel);
  }

  /**
   * returns the amount of movement points which must be spent to *enter* the tile
   * `null` means impassible terrain.
   */
  getMovementCost(position: Position): number | null {
    const baseMovementCost = getBaseMovementCost(
      unitPropertiesMap[this.data.type].movementType,
      getWeatherSpecialMovement(this.player),
      this.match.getTile(position).type,
      this.match.rules.gameVersion ?? this.player.data.coId.version,
    );

    if (baseMovementCost === null) {
      return null;
    }

    return this.player.getHook("movementCost")?.(baseMovementCost, this) ?? baseMovementCost;
  }

  // OTHERS ********************************************************************
  getBuildCost(): number {
    const { cost: baseCost } = this.properties;
    const hook = this.player.getHook("buildCost");
    return hook?.(baseCost, this.match) ?? baseCost;
  }

  remove(): void {
    this.player.team.vision?.removeUnitVision(this);
    this.match.units = this.match.units.filter((u) => !u.data.position.isSame(this.data.position));
  }

  // UNIT TYPE CHECKS **********************************************************
  isIndirect(): this is UnitWrapper<
    "artillery" | "missile" | "battleship" | "carrier" | "pipeRunner" | "rocket"
  > {
    if (!("attackRange" in this.properties)) {
      return false;
    }

    return this.properties.attackRange[1] > 1;
  }

  getAttackRange(): { minRange: number; maxRange: number } | undefined {
    const unitProperties = unitPropertiesMap[this.data.type];

    if (!("attackRange" in unitProperties)) {
      return undefined;
    }

    let maximumAttackRange =
      unitProperties.attackRange[1] - (this.match.getCurrentWeather() === "sandstorm" ? 1 : 0);

    maximumAttackRange =
      this.player.getHook("attackRange")?.(maximumAttackRange, this) ?? maximumAttackRange;

    // we'll need this logic to prevent e.g. Max from having
    // [2, 1] (invalid) artillery attack range in sandstorms.
    maximumAttackRange = Math.max(unitProperties.attackRange[0], maximumAttackRange);

    return { minRange: unitProperties.attackRange[0], maxRange: maximumAttackRange };
  }

  isInfantryOrMech(): this is UnitWrapper<"infantry" | "mech"> {
    return this.data.type === "infantry" || this.data.type === "mech";
  }

  isTransport(): this is TransportUnit {
    return "loadedUnit" in this.data;
  }

  /**
   * doesn't check for fuel or move range, just checks if current tile/position
   * is passable (relevant for e.g. transports) and if destination tile is passable.
   * as of writing only used by unload logic.
   */
  canMoveTo(position: Position): boolean {
    /**
     * units can't move to a position if their baseMovementCost
     * is null for the destination AND their current position.
     * current position is relevant for e.g. loaded units in transports.
     */

    const baseMovementCostOrigin = getBaseMovementCost(
      this.properties.movementType,
      getWeatherSpecialMovement(this.player),
      this.match.getTile(this.data.position).type,
      this.player.match.rules.gameVersion ?? this.player.data.coId.version,
    );

    if (baseMovementCostOrigin === null) {
      return false;
    }

    const baseMovementCostDestination = getBaseMovementCost(
      this.properties.movementType,
      getWeatherSpecialMovement(this.player),
      this.match.getTile(position).type,
      this.player.match.rules.gameVersion ?? this.player.data.coId.version,
    );

    return baseMovementCostDestination !== null;
  }
}

export class TransportUnit extends UnitWrapper<"apc" | "transportCopter" | "blackBoat" | "lander"> {
  getLoadedUnit(slot: 1 | 2): UnitWrapper {
    if (slot === 1) {
      if (this.data.loadedUnit === null) {
        throw new DispatchableError("Transport doesn't currently have a loaded unit in slot 1");
      }

      const unitDataForWrapper: WWUnit = {
        ...this.data.loadedUnit,
        playerSlot: this.data.playerSlot,
        isReady: false,
        position: this.data.position,
      };

      return new UnitWrapper(unitDataForWrapper, this.match);
    } else {
      if (!("loadedUnit2" in this.data)) {
        throw new Error("This transport unit doesn't have a second slot");
      }

      if (this.data.loadedUnit2 === null) {
        throw new DispatchableError("Transport doesn't currently have a loaded unit in slot 2");
      }

      const unitDataForWrapper: WWUnit = {
        ...this.data.loadedUnit2,
        playerSlot: this.data.playerSlot,
        isReady: false,
        position: this.data.position,
      };

      return new UnitWrapper(unitDataForWrapper, this.match);
    }
  }

  unload({ slot, direction }: { slot: 1 | 2; direction: Direction }): void {
    this.player.addUnwrappedUnit({
      ...this.getLoadedUnit(slot).data,
      isReady: false,
      position: this.data.position.addDirection(direction),
    });

    if (slot === 1) {
      if ("loadedUnit2" in this.data) {
        this.data.loadedUnit = this.data.loadedUnit2;
        this.data.loadedUnit2 = null;
      } else {
        this.data.loadedUnit = null;
      }
    } else {
      if (!("loadedUnit2" in this.data)) {
        throw new Error(
          "This transport unit doesn't have a second slot (this should logically never happen since we check for this above)",
        );
      }

      this.data.loadedUnit2 = null;
    }
  }
}
