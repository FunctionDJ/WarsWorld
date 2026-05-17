import { throwIfUndefined } from "shared/throw-helper";
import { z } from "zod";
import { type Position, positionSchema } from "./position";

export class Path {
	constructor(private readonly data: readonly Position[]) {}

	/**
	 * @throws {TypeError} if the index is out of bounds
	 */
	at(readableIndex: number | "last"): Position {
		const index = readableIndex === "last" ? -1 : readableIndex;

		return throwIfUndefined(
			this.data.at(index),
			`Could not get position at index ${String(readableIndex)} of path`,
		);
	}

	len(): number {
		return this.data.length;
	}

	/** Returns a new Path containing all positions except the first one. */
	tail(): Path {
		return new Path(this.data.slice(1));
	}

	/** Returns a new Path with the given position appended to the end. */
	with(position: Position): Path {
		return new Path([...this.data, position]);
	}

	contains(position: Position): boolean {
		return this.data.some((pos) => pos.isSame(position));
	}

	toSerializable(): z.input<typeof pathSchema> {
		return this.data.map((pos) => [pos.data[0], pos.data[1]]);
	}
}

// [improvement] try out integrating the schema into the class as a static property

export const pathSchema = z
	.array(positionSchema)
	.readonly()
	.transform((positions) => new Path(positions));
