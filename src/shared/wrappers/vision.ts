import { Position } from "shared/schemas/position";
import { throwIfUndefined } from "shared/throw-helper";
import type { Team } from "./team";
import type { Unit } from "./unit";

/**
 * Only used for when fog of war!
 */
export class Vision {
	private readonly visionArray: Uint16Array; // i put 16 cause 2^8 = 256 and we *could* go over 256, in theory

	// [improvement] does a set make sense here? maybe we need a more sophisticated data structure to deduplicate positions.
	protected readonly ownedProperties: Set<Position>;

	// used for temporary information storage. does not guarantee that a position is not in both at the same time
	// (but making discovered have priority over undiscovered works for all current events)
	protected discoveredPositions: Position[] = [];
	protected undiscoveredPositions: Position[] = [];

	constructor(private readonly team: Team) {
		const { map } = team.match;
		const visionArraySize = map.width * map.height;
		this.visionArray = new Uint16Array(visionArraySize);
		this.ownedProperties = new Set<Position>();

		// add property and pipeSeam vision
		for (let y = 0; y < map.height; y++) {
			for (let x = 0; x < map.width; x++) {
				const position = new Position([x, y]);
				const tile = team.match.getTile(position);

				if (
					("playerSlot" in tile &&
						team.match.getPlayerBySlot(tile.playerSlot).team.index === team.index) ||
					tile.type === "pipeSeam"
				) {
					this.addOwnedProperty(position);
				}
			}
		}

		// add unit vision
		for (const unit of team.getUnits()) {
			this.addUnitVision(unit);
		}
	}

	/**
	 * Returns new discovered positions until now, and resets the array.
	 * Does NOT work when recalculateVision() is called!
	 */
	getDiscoveredPositionsAndClear(): readonly Position[] {
		const discoveredPositions = [...this.discoveredPositions];
		this.discoveredPositions = [];
		return discoveredPositions;
	}

	/**
	 * Returns new undiscovered positions until now, and resets the array.
	 * Does NOT work when recalculateVision() is called!
	 */
	getUndiscoveredPositionsAndClear(): readonly Position[] {
		const undiscoveredPositions = [...this.undiscoveredPositions];
		this.undiscoveredPositions = [];
		return undiscoveredPositions;
	}

	/**
	 * Returns is a position is visible, !supposing fog of war is activated!
	 */
	isPositionVisible(position: Position): boolean {
		const result =
			this.visionArray[position.data[1] * this.team.match.map.width + position.data[0]];

		return throwIfUndefined(result, `Position ${position.data.toString()} is out of bounds`) > 0;
	}

	/**
	 * Used when a non-owned property gets captured.
	 */
	addOwnedProperty(position: Position): void {
		this.ownedProperties.add(position);
		// you will always have vision of a property you just captured cause a unit has to be on top
		this.changeVision(position, true);
	}

	/**
	 * Used when an owned property gets captured.
	 */
	removeOwnedProperty(position: Position): void {
		this.ownedProperties.delete(position);
		this.changeVision(position, false);
	}

	private changeUnitVision(unit: Unit, addVision: boolean): void {
		const visionRange = unit.getVisionRange();
		const activeSonjaPower =
			unit.player.data.coId.name === "sonja" && unit.player.data.COPowerState !== "no-power";
		const matchMap = unit.player.match.map;

		for (let rowIndex = -visionRange; rowIndex <= visionRange; ++rowIndex) {
			for (
				let columnIndex = -(visionRange - Math.abs(rowIndex));
				columnIndex <= visionRange - Math.abs(rowIndex);
				++columnIndex
			) {
				const pos = unit.data.position.offset({ x: rowIndex, y: columnIndex });

				if (matchMap.isOutOfBounds(pos)) {
					continue;
				}

				// if not next to forest or reef and sonja power not active, skip

				if (
					(matchMap.getTile(pos).type === "forest" || matchMap.getTile(pos).type === "reef") &&
					!activeSonjaPower &&
					Math.abs(rowIndex) + Math.abs(columnIndex) > 1
				) {
					continue;
				}

				this.changeVision(pos, addVision);
			}
		}
	}

	/**
	 * Used for creating, unloading or moving units.
	 */
	addUnitVision(unit: Unit): void {
		this.changeUnitVision(unit, true);
	}

	/**
	 * Used for when a unit dies or a unit moves from a position.
	 */
	removeUnitVision(unit: Unit): void {
		this.changeUnitVision(unit, false);
	}

	/**
	 * Used for vision powers (and expiring powers) and rain activation / deactivation.
	 * Does NOT update new discovered / undiscovered positions.
	 */
	recalculateVision(units: readonly Unit[]): void {
		this.visionArray.fill(0);

		for (const property of this.ownedProperties.values()) {
			this.changeVision(property, true);
		}

		for (const unit of units) {
			this.addUnitVision(unit);
		}
	}

	private changeVision(position: Position, addVision: boolean): void {
		const index = position.data[1] * this.team.match.map.width + position.data[0];
		const currentVision = throwIfUndefined(this.visionArray[index], "Position is out of bounds");

		if (addVision) {
			this.visionArray[index] = currentVision + 1;

			if (this.visionArray[index] === 1) {
				this.discoveredPositions.push(position);
			}
		} else {
			this.visionArray[index] = currentVision - 1;

			if (this.visionArray[index] === 0) {
				this.undiscoveredPositions.push(position);
			}
		}
	}
}
