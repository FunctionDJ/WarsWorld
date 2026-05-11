import { DispatchableError } from "shared/dispatchable-error";
import { unitPropertiesMap } from "shared/match-logic/game-constants/unit-properties";
import type { Position } from "shared/schemas/position";
import type { PassableTile } from "shared/schemas/tile";
import type {
  IndirectTypeString,
  InfantryOrMechTypeString,
  LoadedTypeString,
  TransportTypeString,
  UnitByVisibilityAndTypeString,
  UnitTypeString,
  Visibility,
} from "shared/schemas/unit";
import { getBaseMovementCost } from "../../match-logic/movement-cost";
import { getWeatherSpecialMovement } from "../../match-logic/weather";
import type { MatchWrapper } from "../match/match";
import type { PlayerInMatchWrapper } from "../player/player-in-match";

export interface TransportMethods {
  getLoadedUnit: (slot: 1 | 2) => UnitWrapper<Visibility, LoadedTypeString>;
}

export class UnitWrapper<
  TVisibility extends Visibility = Visibility,
  Type extends UnitTypeString = UnitTypeString,
> {
  public player: PlayerInMatchWrapper<TVisibility>;

  public properties: (typeof unitPropertiesMap)[Type];

  constructor(
    public readonly data: UnitByVisibilityAndTypeString<TVisibility, Type>,
    public match: MatchWrapper,
  ) {
    const player = match.getPlayerBySlot(data.playerSlot);
    this.player = player;
    this.properties = unitPropertiesMap[data.type];
  }

  getFuel(): number {
    if (this.data.stats === "hidden") {
      return this.properties.initialFuel;
    }

    return this.data.stats.fuel;
  }

  /**
   * returning `undefined` means this unit doesn't use ammo
   */
  getAmmo(): number | undefined {
    if (this.data.stats === "hidden") {
      return "initialAmmo" in this.properties ? this.properties.initialAmmo : undefined;
    }

    if (!("ammo" in this.data.stats)) {
      return;
    }

    return this.data.stats.ammo;
  }

  getHP(): number {
    if (this.data.stats === "hidden") {
      return 100;
    }

    return this.data.stats.hp;
  }

  getVisualHP(): number {
    return Math.ceil(this.getHP() / 10);
  }

  getTile(): PassableTile {
    return this.match.getPassableTile(this.data.position);
  }

  getNeighbouringUnits(): UnitWrapper<TVisibility>[] {
    const neighbourPositions = this.data.position.getNeighbours();

    return this.match.units.filter((unit: UnitWrapper<TVisibility>) =>
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
   * `undefined` means impassible terrain.
   */
  getMovementCost(position: Position): number | undefined {
    const baseMovementCost = getBaseMovementCost(
      unitPropertiesMap[this.data.type].movementType,
      getWeatherSpecialMovement(this.player),
      this.match.getPassableTile(position).type,
      this.match.rules.gameVersion ?? this.player.data.coId.version,
    );

    if (baseMovementCost === undefined) {
      return;
    }

    return this.player.getHook("movementCost")?.(baseMovementCost, this) ?? baseMovementCost;
  }

  getBuildCost(): number {
    const { cost: baseCost } = this.properties;
    const hook = this.player.getHook("buildCost");
    return hook?.(baseCost, this.match) ?? baseCost;
  }

  isIndirect(): this is UnitWrapper<TVisibility, IndirectTypeString> {
    if (!("attackRange" in this.properties)) {
      return false;
    }

    return this.properties.attackRange[1] > 1;
  }

  getAttackRange(): { minRange: number; maxRange: number } {
    const unitProperties = unitPropertiesMap[this.data.type];

    if (!("attackRange" in unitProperties)) {
      throw new DispatchableError("Unit cannot attack");
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

  isInfantryOrMech(): this is UnitWrapper<TVisibility, InfantryOrMechTypeString> {
    return this.data.type === "infantry" || this.data.type === "mech";
  }

  // TODO this is Transport (?)
  isTransport(): this is UnitWrapper<TVisibility, TransportTypeString> & TransportMethods {
    return (
      this.data.type === "apc" ||
      this.data.type === "transportCopter" ||
      this.data.type === "blackBoat" ||
      this.data.type === "lander" ||
      this.data.type === "carrier" ||
      this.data.type === "cruiser"
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
      this.match.getPassableTile(this.data.position).type,
      this.player.match.rules.gameVersion ?? this.player.data.coId.version,
    );

    if (baseMovementCostOrigin === undefined) {
      return false;
    }

    const baseMovementCostDestination = getBaseMovementCost(
      this.properties.movementType,
      getWeatherSpecialMovement(this.player),
      this.match.getPassableTile(position).type,
      this.player.match.rules.gameVersion ?? this.player.data.coId.version,
    );

    return baseMovementCostDestination !== undefined;
  }
}
