import { DispatchableError } from "shared/errors";

export class UnloadPositionError extends DispatchableError {
	constructor() {
		super("One of the positions for unload is invalid");
	}
}
