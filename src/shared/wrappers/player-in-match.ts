import { IllegalActionError, InvalidStateError } from "shared/errors";
import type { COPowerState } from "shared/match-logic/co";
import { getCOProperties } from "shared/match-logic/co";
import type { Hooks } from "shared/match-logic/co-hooks";
import type { CO } from "shared/schemas/co";
import type { GameVersion } from "shared/schemas/game-version";
import type { Tile } from "shared/schemas/tile";
import type { UnitData } from "shared/schemas/unit-schemas";
import type { PlayerInMatch } from "shared/server-match-state";
import type { DistributedOmit } from "type-fest";
import {
	versionPropertiesMap,
	type VersionProperties,
} from "../match-logic/game-constants/version-properties";
import type { MatchWrapper } from "./match";
import type { Team } from "./team";
import { Unit } from "./unit";

export class PlayerInMatchWrapper {
	public readonly match: MatchWrapper;

	constructor(
		public readonly team: Team,
		public data: PlayerInMatch,
	) {
		this.match = team.match;
	}

	/**
	 * returns amount of commtowers owned * 10 (since 1 commtower gives 10% attack boost)
	 */
	getCommtowerAttackBoost(): number {
		const ownedCommtowers = this.match.changeableTiles.filter(
			(tile) => tile.type === "commtower" && this.owns(tile),
		);
		return ownedCommtowers.length * 10;
	}

	hasLab(): boolean {
		return this.match.changeableTiles.some((tile) => tile.type === "lab" && this.owns(tile));
	}

	// [improvement]
	/**
	 * maybe units should be owned by at least the team, but player is probably more convenient
	 * (then units of a specific player are contracted to the players TVisibility)
	 */
	getUnits(): readonly Unit[] {
		return this.match.units.filter((unit) => this.owns(unit));
	}

	getHook<HookType extends keyof Hooks>(hookType: HookType): Hooks[HookType] | undefined {
		const COProperties = getCOProperties(this.data.coId);

		switch (this.data.COPowerState) {
			case "no-power": {
				return COProperties.dayToDay?.hooks[hookType];
			}
			case "co-power": {
				return COProperties.powers.COPower?.hooks?.[hookType];
			}
			case "super-co-power": {
				return COProperties.powers.superCOPower?.hooks?.[hookType];
			}
		}
	}

	getVersionProperties(): VersionProperties {
		return versionPropertiesMap[this.match.rules.gameVersion ?? this.data.coId.version];
	}

	/**
	 * gets the next player, looping back around to index 0
	 * if needed until current player slot.
	 */
	getNextAlivePlayer(): PlayerInMatchWrapper {
		const nextSlot = (n: number): number => (n + 1) % this.match.map.data.numberOfPlayers;

		for (let index = nextSlot(this.data.slot); index !== this.data.slot; index = nextSlot(index)) {
			const player = this.match.getPlayerBySlot(index);

			if (player.data.status === "alive") {
				return player;
			}
		}

		throw new InvalidStateError("No next alive player");
	}

	getPowerStarCost(): number {
		const versionProperties = this.getVersionProperties();
		return (
			versionProperties.baseStarValue *
			(1 + versionProperties.powerMeterScaling * Math.min(this.data.timesPowerUsed, 10))
		);
	}

	getMaxPowerMeter(): number {
		const COPowers = getCOProperties(this.data.coId).powers;

		if (COPowers.superCOPower !== undefined) {
			return COPowers.superCOPower.stars * this.getPowerStarCost();
		}

		if (COPowers.COPower !== undefined) {
			return COPowers.COPower.stars * this.getPowerStarCost();
		}

		return 0;
	}

	owns(tileOrUnit: Tile | Unit): boolean {
		if ("playerSlot" in tileOrUnit && tileOrUnit.playerSlot === this.data.slot) {
			return true;
		}

		if (
			"data" in tileOrUnit &&
			"playerSlot" in tileOrUnit.data &&
			tileOrUnit.data.playerSlot === this.data.slot
		) {
			return true;
		}

		return false;
	}

	/** @throws {IllegalActionError} */
	ownsOrThrow(tileOrUnit: Tile | Unit): void {
		if (!this.owns(tileOrUnit)) {
			throw new IllegalActionError("Invalid action on tile or unit not owned by player");
		}
	}

	getFundsPerTurn(): number {
		let numberOfFundsGivingProperties = 0;

		for (const changeableTile of this.match.changeableTiles) {
			if (
				changeableTile.type !== "lab" &&
				changeableTile.type !== "commtower" &&
				this.owns(changeableTile)
			) {
				numberOfFundsGivingProperties++;
			}
		}

		let { fundsPerProperty } = this.match.rules;

		if (this.data.coId.name === "sasha") {
			fundsPerProperty += 100;
		}

		return numberOfFundsGivingProperties * fundsPerProperty;
	}

	/**
	 * Check current power activated with optional CO constraints
	 */
	isUsingPower(power: COPowerState, coName?: CO, coVersion?: GameVersion): boolean {
		if (power !== this.data.COPowerState) {
			return false;
		}

		if (coName && coName !== this.data.coId.name) {
			return false;
		}

		if (coVersion && coVersion !== this.data.coId.version) {
			return false;
		}

		return true;
	}

	gainPowerCharge(value: number): void {
		if (this.data.COPowerState !== "no-power") {
			return;
		}

		this.data.powerMeter = Math.min(value, this.getMaxPowerMeter());
	}

	addUnwrappedUnit(
		rawUnit: DistributedOmit<UnitData, "playerSlot" | "isReady" | "hp" | "fuel"> &
			Partial<Pick<UnitData, "isReady" | "hp" | "fuel">>,
	): Unit {
		const unitWithPlayerSlot: UnitData = {
			...rawUnit,
			playerSlot: this.data.slot,
			isReady: rawUnit.isReady ?? false,
			hp: rawUnit.hp ?? 100,
			fuel: rawUnit.fuel ?? 100,
		};

		const unit = new Unit(this, unitWithPlayerSlot);
		this.match.units.push(unit);
		this.team.vision?.addUnitVision(unit);

		return unit;
	}
}
