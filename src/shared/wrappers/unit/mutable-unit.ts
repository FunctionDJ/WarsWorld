import { clamp } from "shared/math-utilities";
import type {
    UnitByVisibilityAndTypeString,
    UnitTypeString,
    Visibility,
} from "shared/schemas/unit";
import type { MutableMatch } from "../match/mutable-match";
import type { MutablePlayerInMatch } from "../player/mutable-player-in-match";
import type { MutableTransport } from "./mutable-transport";
import { UnitWrapper } from "./unit";

export class MutableUnit<
  TVisibility extends Visibility = Visibility,
  Type extends UnitTypeString = UnitTypeString,
> extends UnitWrapper<TVisibility> {
  public player: MutablePlayerInMatch<TVisibility>;

  constructor(
    public data: UnitByVisibilityAndTypeString<TVisibility, Type>,
    public match: MutableMatch,
  ) {
    super(data, match);

    const player = match.getPlayerBySlot(data.playerSlot);

    if (player === undefined) {
      throw new Error(`Could not find player by slot ${String(data.playerSlot)}`);
    }

    this.player = player;
  }

  isTransport(): this is MutableTransport<TVisibility> {
    return (
      this.data.type === "apc" ||
      this.data.type === "transportCopter" ||
      this.data.type === "blackBoat" ||
      this.data.type === "lander" ||
      this.data.type === "carrier" ||
      this.data.type === "cruiser"
    );
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

  /**
   * used by at least the "destroy" action
   */
  remove(): void {
    this.player.team.vision?.removeUnitVision(this);

    const index = this.match.units.findIndex((u) => u.data.position.isSame(this.data.position));

    if (index === -1) {
      throw new Error("Tried to remove unit that does not exist in match");
    }

    this.match.units.splice(index, 1);
  }
}
