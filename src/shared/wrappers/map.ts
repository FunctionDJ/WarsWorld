import type { WWMap } from "generated/browser";
import { arrayAtOrThrow } from "shared/array-utilities";
import type { Position } from "shared/schemas/position";
import type { PassableTile } from "shared/schemas/tile";
import type { RO } from "shared/types/ww-readonly";

export class MapWrapper {
  public readonly width: number;
  public readonly height: number;

  constructor(public readonly data: RO<WWMap>) {
    this.width = arrayAtOrThrow(this.data.tiles, 0).length;
    this.height = this.data.tiles.length;
  }

  getTile(position: Position): PassableTile {
    this.throwIfOutOfBounds(position);
    const row = arrayAtOrThrow(this.data.tiles, position.data[1]);
    return arrayAtOrThrow(row, position.data[0]);
  }

  isOutOfBounds(position: Position): boolean {
    const { data } = position;
    return data[0] < 0 || data[0] >= this.width || data[1] < 0 || data[1] >= this.height;
  }

  throwIfOutOfBounds(position: Position): void {
    if (this.isOutOfBounds(position)) {
      throw new Error(
        `Out of bounds position ${JSON.stringify(position)} for map ${this.data.name}`,
      );
    }
  }
}
