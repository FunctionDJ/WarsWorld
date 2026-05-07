import { DispatchableError } from "shared/dispatchable-error";

export class UnloadPositionError extends DispatchableError {
  constructor() {
    super("One of the positions for unload is invalid");
  }
}
