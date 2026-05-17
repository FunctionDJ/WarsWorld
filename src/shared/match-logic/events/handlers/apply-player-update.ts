import type { EmittableAttackEvent } from "shared/events";
import type { MatchWrapper } from "shared/wrappers/match";

export const applyPlayerUpdate = (
	match: MatchWrapper,
	playerUpdate: EmittableAttackEvent["playerUpdate"],
): void => {
	for (const playerInUpdate of playerUpdate) {
		const playerInMatch = match.getPlayerById(playerInUpdate.id);
		playerInMatch.data = playerInUpdate;
	}
};
