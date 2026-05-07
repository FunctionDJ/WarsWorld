import { DispatchableError } from "shared/dispatchable-error";
import type { LoadedTypeString, TransportTypeString, Visibility } from "shared/schemas/unit";
import { UnitWrapper } from "./unit";

export class Transport<TVisibility extends Visibility = Visibility> extends UnitWrapper<
  TVisibility,
  TransportTypeString
> {
  getLoadedUnit(slot: 1 | 2): UnitWrapper<Visibility, LoadedTypeString> {
    if (slot === 1) {
      if (this.data.loadedUnit === undefined) {
        throw new DispatchableError("Transport doesn't currently have a loaded unit in slot 1");
      }

      return new UnitWrapper<Visibility, LoadedTypeString>(
        {
          ...this.data.loadedUnit,
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

    if (this.data.loadedUnit2 === undefined) {
      throw new DispatchableError("Transport doesn't currently have a loaded unit in slot 2");
    }

    return new UnitWrapper<Visibility, LoadedTypeString>(
      {
        ...this.data.loadedUnit2,
        playerSlot: this.data.playerSlot,
        isReady: false,
        position: this.data.position,
      },
      this.match,
    );
  }
}
