import { z } from "zod";

// Position / Coordinate System
//
// AWBW and probably AW too starts "x: 0, y: 0" in the top-left corner.
// So going down means y increases.

// === POSITION ===

export const positionSchema = z
  .tuple([z.number().int().nonnegative(), z.number().int().nonnegative()])
  .transform((pos) => new Position(pos));

export class Path {
  constructor(public data: Position[]) {}

  get(arg: number | "last"): Position {
    const index = arg === "last" ? -1 : arg;
    const pos = this.data.at(index);

    if (pos === undefined) {
      throw new Error(`Could not get position at index ${String(index)} of path`);
    }

    return pos;
  }
}

export class Position {
  constructor(public readonly data: [number, number]) {}

  isSame(other: Position) {
    return this.data[0] === other.data[0] && this.data[1] === other.data[1];
  }

  isNeighbour(other: Position) {
    const xDiff = Math.abs(this.data[0] - other.data[0]);
    const yDiff = Math.abs(this.data[1] - other.data[1]);

    return xDiff + yDiff === 1;
  }

  getNeighbours() {
    return [
      new Position([this.data[0] + 1, this.data[1]]),
      new Position([this.data[0] - 1, this.data[1]]),
      new Position([this.data[0], this.data[1] + 1]),
      new Position([this.data[0], this.data[1] - 1]),
    ];
  }

  getDistance(other: Position) {
    return Math.abs(this.data[0] - other.data[0]) + Math.abs(this.data[1] - other.data[1]);
  }

  addDirection(direction: Direction) {
    switch (direction) {
      case "up":
        return new Position([this.data[0], this.data[1] - 1]);
      case "down":
        return new Position([this.data[0], this.data[1] + 1]);
      case "left":
        return new Position([this.data[0] - 1, this.data[1]]);
      case "right":
        return new Position([this.data[0] + 1, this.data[1]]);
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

  offset({ x, y }: { x: number; y: number }) {
    return new Position([this.data[0] + x, this.data[1] + y]);
  }
}

// === PATH ===

export const pathSchema = z.array(positionSchema).transform((positions) => new Path(positions));

// === DIRECTION ===

export const directionSchema = z.enum(["up", "down", "left", "right"]);

type Direction = z.infer<typeof directionSchema>;

export const allDirections = directionSchema.options;
