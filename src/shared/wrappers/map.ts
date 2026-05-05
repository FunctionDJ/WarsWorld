import type { WWMap } from "generated/browser";
import type { Position } from "shared/schemas/position";

export class MapWrapper {
  public width: number;
  public height: number;

  constructor(public data: WWMap) {
    const firstRow = this.data.tiles[0];

    if (firstRow === undefined) {
      throw new Error(`Unexpected error: map data for map ${this.data.name} has no rows`);
    }

    this.width = firstRow.length;
    this.height = this.data.tiles.length;
  }

  getTile(position: Position) {
    this.throwIfOutOfBounds(position);
    const row = this.data.tiles[position.data[1]];

    if (row === undefined) {
      throw new Error(
        `Unexpected error: row ${String(position.data[1])} does not exist in map data for map ${this.data.name}`,
      );
    }

    const tile = row[position.data[0]];

    if (tile === undefined) {
      throw new Error(
        `Unexpected error: column ${String(position.data[0])} does not exist in map data for map ${this.data.name}`,
      );
    }

    return tile;
  }

  isOutOfBounds(position: Position) {
    const { data } = position;
    return data[0] < 0 || data[0] >= this.width || data[1] < 0 || data[1] >= this.height;
  }

  throwIfOutOfBounds(position: Position) {
    if (this.isOutOfBounds(position)) {
      throw new Error(
        `Out of bounds position ${JSON.stringify(position)} for map ${this.data.name}`,
      );
    }
  }
}
