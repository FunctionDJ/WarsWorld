import type { WWReadOnly } from "shared/types/ww-readonly";
import { z } from "zod";
import { Position, positionSchema } from "./position";

export class Path {
  constructor(private readonly data: readonly Position[]) {}

  /**
   * @throws {TypeError} if the index is out of bounds
   */
  at(readableIndex: number | "last"): WWReadOnly<Position> {
    const index = readableIndex === "last" ? -1 : readableIndex;
    const pos = this.data.at(index);

    if (pos === undefined) {
      throw new TypeError(`Could not get position at index ${String(index)} of path`);
    }

    return pos;
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
}

export const pathSchema = z
  .array(positionSchema)
  .readonly()
  .transform((positions) => new Path(positions));
