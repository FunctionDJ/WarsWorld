import { DispatchableError } from "shared/dispatchable-error";
import type { Direction } from "shared/schemas/direction";
import type {
  LoadedTypeString,
  TransportTypeString,
  UnitByVisibilityAndTypeString,
  Visibility,
} from "shared/schemas/unit";
import { throwIfUndefined } from "shared/types/throw-helper";
import type { MutableMatch } from "../match/mutable-match";
import type { MutablePlayerInMatch } from "../player/mutable-player-in-match";
import { MutableUnit } from "./mutable-unit";
import { UnitWrapper } from "./unit";

export class MutableTransport<TVisibility extends Visibility = Visibility> extends MutableUnit<
  TVisibility,
  TransportTypeString
> {
  public player: MutablePlayerInMatch<TVisibility>;

  constructor(
    public data: UnitByVisibilityAndTypeString<TVisibility, TransportTypeString>,
    public match: MutableMatch,
  ) {
    super(data, match);
    const player = match.getPlayerBySlot(data.playerSlot);
    this.player = player;
  }

  getLoadedUnit(slot: 1 | 2): UnitWrapper<Visibility, LoadedTypeString> {
    if (slot === 1) {
      return new UnitWrapper<Visibility, LoadedTypeString>(
        {
          ...throwIfUndefined(this.data.loadedUnit),
          playerSlot: this.data.playerSlot,
          isReady: false,
          position: this.data.position,
        },
        this.match,
      );
    }

    if (!("loadedUnit2" in this.data)) {
      throw new DispatchableError("This transport type doesn't support a second loaded unit");
    }

    return new UnitWrapper<Visibility, LoadedTypeString>(
      {
        ...throwIfUndefined(this.data.loadedUnit2),
        playerSlot: this.data.playerSlot,
        isReady: false,
        position: this.data.position,
      },
      this.match,
    );
  }

  unload({ slot, direction }: Readonly<{ slot: 1 | 2; direction: Direction }>): void {
    const { playerSlot: _playerSlot, ...loadedUnitData } = this.getLoadedUnit(slot).data;
    void _playerSlot;

    // TODO fix type system to make `this.player.addUnwrappedUnit` possible instead of having to go through `this.match.getPlayerBySlot` again

    const player = this.match.getPlayerBySlot(this.data.playerSlot);

    player.addUnwrappedUnit({
      ...loadedUnitData,
      isReady: false,
      position: this.data.position.addDirection(direction),
    });

    if (slot === 1) {
      if ("loadedUnit2" in this.data) {
        this.data.loadedUnit = this.data.loadedUnit2;
        this.data.loadedUnit2 = undefined;
      } else {
        this.data.loadedUnit = undefined;
      }
    } else {
      if (!("loadedUnit2" in this.data)) {
        throw new Error(
          "This transport unit doesn't have a second slot (this should logically never happen since we check for this above)",
        );
      }

      this.data.loadedUnit2 = undefined;
    }
  }
}
