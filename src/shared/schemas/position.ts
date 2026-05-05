import { z } from "zod";

// Position / Coordinate System
//
// AWBW and probably AW too starts "x: 0, y: 0" in the top-left corner.
// So going down means y increases.

// === POSITION ===

export const positionSchema = z
  .tuple([z.number().int().nonnegative(), z.number().int().nonnegative()])
  .transform((pos) => new PositionWrapper(pos));

/** @deprecated */
export type Position = z.infer<typeof positionSchema>;

export class PathWrapper {
  constructor(public data: PositionWrapper[]) {}

  get(arg: number | "last"): PositionWrapper {
    const index = arg === "last" ? -1 : arg;
    const pos = this.data.at(index);

    if (pos === undefined) {
      throw new Error(`Could not get position at index ${String(index)} of path`);
    }

    return pos;
  }
}

export class PositionWrapper {
  constructor(public readonly data: [number, number]) {}

  isSame(other: PositionWrapper) {
    return this.data[0] === other.data[0] && this.data[1] === other.data[1];
  }

  isNeighbour(other: PositionWrapper) {
    const xDiff = Math.abs(this.data[0] - other.data[0]);
    const yDiff = Math.abs(this.data[1] - other.data[1]);

    return xDiff + yDiff === 1;
  }

  getNeighbours() {
    return [
      new PositionWrapper([this.data[0] + 1, this.data[1]]),
      new PositionWrapper([this.data[0] - 1, this.data[1]]),
      new PositionWrapper([this.data[0], this.data[1] + 1]),
      new PositionWrapper([this.data[0], this.data[1] - 1]),
    ];
  }

  getDistance(other: PositionWrapper) {
    return Math.abs(this.data[0] - other.data[0]) + Math.abs(this.data[1] - other.data[1]);
  }

  addDirection(direction: Direction) {
    switch (direction) {
      case "up":
        return new PositionWrapper([this.data[0], this.data[1] - 1]);
      case "down":
        return new PositionWrapper([this.data[0], this.data[1] + 1]);
      case "left":
        return new PositionWrapper([this.data[0] - 1, this.data[1]]);
      case "right":
        return new PositionWrapper([this.data[0] + 1, this.data[1]]);
    }
  }

  /** untested!! */
  getDirectionTo(other: PositionWrapper): Direction {
    const xDiff = other.data[0] - this.data[0];
    const yDiff = other.data[1] - this.data[1];

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      return xDiff > 0 ? "right" : "left";
    }

    return yDiff > 0 ? "down" : "up";
  }

  offset({ x, y }: { x: number; y: number }) {
    return new PositionWrapper([this.data[0] + x, this.data[1] + y]);
  }
}

// === PATH ===

export const pathSchema = z
  .array(positionSchema)
  .transform((positions) => new PathWrapper(positions));

/** @deprecated */
export type Path = z.infer<typeof pathSchema>;

// === DIRECTION ===

export const directionSchema = z.enum(["up", "down", "left", "right"]);

type Direction = z.infer<typeof directionSchema>;

export const allDirections = directionSchema.options;
