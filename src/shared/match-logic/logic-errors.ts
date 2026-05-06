import { DispatchableError } from "shared/DispatchedError";

export class UnloadPositionError extends DispatchableError {
  constructor() {
    super("One of the positions for unload is invalid");
  }
}
