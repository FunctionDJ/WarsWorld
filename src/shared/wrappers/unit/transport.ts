import { DispatchableError } from "shared/dispatchable-error";
import type { LoadedTypeString, TransportTypeString, Visibility } from "shared/schemas/unit";
import { throwIfUndefined } from "shared/types/throw-helper";
import { UnitWrapper } from "./unit";

export class Transport<TVisibility extends Visibility = Visibility> extends UnitWrapper<
  TVisibility,
  TransportTypeString
> {
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
}
