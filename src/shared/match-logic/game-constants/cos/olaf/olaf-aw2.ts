import type { COProperties } from "../../../co";
import { olafAW1 } from "./olaf-aw1";

export const olafAW2: COProperties = {
	...olafAW1,
	gameVersion: "AW2",
	powers: {
		...olafAW1.powers,
		superCOPower: {
			name: "Winter fury",
			description: "All enemy units lose 2 HP, and causes it to snow until next turn.",
			stars: 6,
			instantEffect(player) {
				for (const unit of player.team.getEnemyUnits()) {
					unit.damageUntil1HP(2);
				}

				player.match.setWeather("snow", 1);
			},
		},
	},
};
