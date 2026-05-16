import { z } from "zod";
import type { Direction } from "./direction";

// Position / Coordinate System
//
// AWBW and probably AW too starts "x: 0, y: 0" in the top-left corner.
// So going down means y increases.

// [improvement] change positions to {x,y} instead of [x,y]

export const positionSchema = z
  .tuple([z.number().int().nonnegative(), z.number().int().nonnegative()])
  .readonly()
  .transform((pos) => new Position(pos));

export class Position {
  constructor(public readonly data: readonly [number, number]) {}

  isSame(other: Position): boolean {
    return this.data[0] === other.data[0] && this.data[1] === other.data[1];
  }

  isNeighbour(other: Position): boolean {
    const xDiff = Math.abs(this.data[0] - other.data[0]);
    const yDiff = Math.abs(this.data[1] - other.data[1]);

    return xDiff + yDiff === 1;
  }

  getNeighbours(): readonly Position[] {
    // [improvement] filter neighbour positions that are out of bounds ? (but then we would need map dimensions here)
    return [
      new Position([this.data[0] + 1, this.data[1]]),
      new Position([this.data[0] - 1, this.data[1]]),
      new Position([this.data[0], this.data[1] + 1]),
      new Position([this.data[0], this.data[1] - 1]),
    ];
  }

  getDistance(other: Position): number {
    return Math.abs(this.data[0] - other.data[0]) + Math.abs(this.data[1] - other.data[1]);
  }

  addDirection(direction: Direction): Position {
    switch (direction) {
      case "up": {
        return new Position([this.data[0], this.data[1] - 1]);
      }
      case "down": {
        return new Position([this.data[0], this.data[1] + 1]);
      }
      case "left": {
        return new Position([this.data[0] - 1, this.data[1]]);
      }
      case "right": {
        return new Position([this.data[0] + 1, this.data[1]]);
      }
    }
  }

  /** untested!! */
  getDirectionTo(other: Position): Direction {
    const xDiff = other.data[0] - this.data[0];
    const yDiff = other.data[1] - this.data[1];

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      return xDiff > 0 ? "right" : "left";
    }

    return yDiff > 0 ? "down" : "up";
  }

  offset({ x, y }: Readonly<{ x: number; y: number }>): Position {
    return new Position([this.data[0] + x, this.data[1] + y]);
  }

  toSerializable(): z.input<typeof positionSchema> {
    return this.data;
  }
}
