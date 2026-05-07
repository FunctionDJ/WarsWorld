import { unitPropertiesMap } from "shared/match-logic/game-constants/unit-properties";
import type { Direction } from "shared/schemas/direction";
import type {
  TransportTypeString,
  UnitByVisibilityAndTypeString,
  Visibility,
} from "shared/schemas/unit";
import type { MutableMatch } from "../match/mutable-match";
import type { MutablePlayerInMatch } from "../player/mutable-player-in-match";
import { Transport } from "./transport";

export class MutableTransport<
  TVisibility extends Visibility = Visibility,
> extends Transport<TVisibility> {
  public player: MutablePlayerInMatch<TVisibility>;

  constructor(
    public data: UnitByVisibilityAndTypeString<TVisibility, TransportTypeString>,
    public match: MutableMatch,
  ) {
    super(data, match);

    const player = match.getPlayerBySlot(data.playerSlot);

    if (player === undefined) {
      throw new Error(`Could not find player by slot ${String(data.playerSlot)}`);
    }

    this.player = player;
    this.properties = unitPropertiesMap[data.type];
  }

  unload({ slot, direction }: Readonly<{ slot: 1 | 2; direction: Direction }>): void {
    this.player.addUnwrappedUnit({
      ...this.getLoadedUnit(slot).data,
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
