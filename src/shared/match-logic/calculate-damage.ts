import type { LuckRoll } from "shared/schemas/co";
import type { Unit } from "shared/wrappers/unit";
import type { CombatProperties } from "./co-hooks";
import { getBaseDamage } from "./game-constants/base-damage";
import { getTerrainDefenseStars } from "./game-constants/terrain-properties";

/**
 * @param luckRoll contains goodLuck roll and badLuck roll
 * goodLuck roll number between 0 and 1: 1 = max luck, 0 = no luck
 * badLuck roll same as goodLuck roll (but not always used): 1 = max bad luck, 0 = no bad luck
 * @param isCounterAttack only used for sonja d2d and kanbei during scop (bonus counterattack damage).
 *
 * @see https://awbw.fandom.com/wiki/Damage_Formula
 */
export const calculateDamage = (
	{ attacker, defender }: CombatProperties,
	luckRoll: LuckRoll,
	isCounterAttack: boolean,
): number | undefined => {
	const baseDamage = getBaseDamage(attacker, defender);

	// undefined baseDamage = unit can't attack this other unit
	if (baseDamage === undefined) {
		return;
	}

	const hookProperties: CombatProperties = { attacker, defender };

	// attack and defense multipliers
	const attackHook = attacker.player.getHook("attack");
	let attackModifier =
		attackHook?.(hookProperties) ?? 100 + attacker.player.getCommtowerAttackBoost();

	if (isCounterAttack) {
		const dCoId = defender.player.data.coId;

		if (dCoId.name === "sonja" && (dCoId.version === "AW1" || dCoId.version === "AW2")) {
			attackModifier += 50; // aw1 and aw2 sonja d2d is +50% firepower on counters
		} else if (dCoId.name === "kanbei" && defender.player.data.COPowerState === "super-co-power") {
			// eslint-disable-next-line unicorn/prefer-ternary
			if (dCoId.version === "AW2") {
				attackModifier *= 5 / 3; // aw2 kanbei with super deals x5/3 dmg on counters
			} else {
				attackModifier *= 2; // awds kanbei with super deals double dmg on counters
			}
		}
	}

	const attackerVersionProperties = attacker.player.getVersionProperties();

	if (attacker.player.data.COPowerState !== "no-power") {
		attackModifier = attackerVersionProperties.powerFirepowerMod(attackModifier);
	}

	const defenseHook = defender.player.getHook("defense");
	let defenseModifier = defenseHook?.(hookProperties) ?? 100;

	if (defender.player.data.COPowerState !== "no-power") {
		defenseModifier = defender.player.getVersionProperties().powerDefenseMod(defenseModifier);
	}

	// luck calculations
	const goodLuckHook = attacker.player.getHook("maxGoodLuck");
	const maxGoodLuck = goodLuckHook?.(hookProperties) ?? attackerVersionProperties.baseGoodLuck;
	const badLuckHook = attacker.player.getHook("maxBadLuck");
	const maxBadLuck = badLuckHook?.(hookProperties) ?? attackerVersionProperties.baseBadLuck;

	// needs the special case luckRoll == 1 (so maxLuck = 1 gives expected results consistent with floor)
	const goodLuckValue =
		luckRoll.goodLuck === 1 ? maxGoodLuck - 1 : Math.floor(luckRoll.goodLuck * maxGoodLuck);

	const badLuckValue =
		luckRoll.badLuck === 1 ? maxBadLuck - 1 : Math.floor(luckRoll.badLuck * maxBadLuck);

	// terrain stars calculations
	const baseTerrainStars = getTerrainDefenseStars(defender.getTile().type);

	const terrainStarsDefenderHook = defender.player.getHook("terrainStars");

	let defenderTerrainStars =
		terrainStarsDefenderHook?.(baseTerrainStars, hookProperties) ?? baseTerrainStars;

	if (attacker.player.data.coId.name === "sonja" && attacker.player.data.coId.version === "AWDS") {
		// [cartridge-inaccurate] in AWDS, order of sonja power vs lash power have different outcomes
		// (for lash's effective terrain stars).
		// this function currently always processes lash power modifiers/hooks before sonja, which is
		// technically a nerv for AWDS sonja.
		switch (attacker.player.data.COPowerState) {
			case "no-power": {
				defenderTerrainStars = Math.max(0, defenderTerrainStars - 1);
				break;
			}
			case "co-power": {
				defenderTerrainStars = Math.max(0, defenderTerrainStars - 2);
				break;
			}
			case "super-co-power": {
				defenderTerrainStars = Math.max(0, defenderTerrainStars - 3);
				break;
			}
		}
	}

	// TODO explain magic values
	// damage formula application

	const luckModifier = goodLuckValue - badLuckValue;

	const attackFactor = Math.max(0, Math.floor(baseDamage * (attackModifier / 100) + luckModifier));

	const attackHPFactor = Math.floor(attackFactor * (attacker.getVisualHP() / 10));

	const defenseFactor =
		Math.floor(200 - (defenseModifier + defenderTerrainStars * defender.getVisualHP())) / 100;

	const damageAsPercentage = Math.floor(attackHPFactor * defenseFactor);

	return damageAsPercentage;
};

// can return negative hp values (useful for damage calculator / displaying damage range)
export const calculateEngagementOutcome = (
	attacker: Unit,
	defender: Unit,
	attackerLuck: LuckRoll,
	defenderLuck: LuckRoll,
): { defenderHP: number; attackerHP?: number } => {
	let damageByAttacker = calculateDamage(
		{
			attacker,
			defender,
		},
		attackerLuck,
		false,
	);

	damageByAttacker ??= 0; // this is necessary cause sonja scop reverses attacker and defender

	// check if ded
	if (damageByAttacker >= defender.getHPOr100()) {
		return {
			defenderHP: defender.getHPOr100() - damageByAttacker,
			attackerHP: undefined,
		};
	}

	// check if defender can counterattack
	if (
		attacker.data.position.getDistance(defender.data.position) === 1 &&
		// defender is melee, maybe can counterattack
		"attackRange" in defender.properties &&
		defender.properties.attackRange[1] === 1
	) {
		// temporarily subtract hp to calculate counter dmg
		const originalHP = defender.data.hp;

		/**
		 * attention! unlike all other action-to-event code, we actually mutate server state here
		 * for convenience for HP calculations *before* applying the event.
		 * that's why it's obviously critical to reset the defender's HP back to originalHP after calculation.
		 * maybe we can clean this up later.
		 * ideally we'd clone the defender unit or something in a way that assures no server state is mutated,
		 * because all other action-to-event code doesn't (or at least shouldn't) mutate server state.
		 */

		// [cringe-code]
		defender.setHp(defender.getHPOr100() - damageByAttacker);

		const damageByDefender = calculateDamage(
			{
				attacker: defender,
				defender: attacker,
			},
			defenderLuck,
			true,
		);

		defender.data.hp = originalHP; // <-- important

		if (damageByDefender !== undefined) {
			// return event with counter-attack
			return {
				defenderHP: defender.getHPOr100() - damageByAttacker,
				attackerHP: attacker.getHPOr100() - damageByDefender,
			};
		}
	}

	return {
		defenderHP: defender.getHPOr100() - damageByAttacker,
		attackerHP: undefined,
	};
};
