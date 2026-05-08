import type { EmittableAttackEvent } from "shared/types/events";
import type { MutableMatch } from "shared/wrappers/match/mutable-match";

export const applyPlayerUpdate = (
  match: MutableMatch,
  playerUpdate: EmittableAttackEvent["playerUpdate"],
): void => {
  for (const playerInUpdate of playerUpdate) {
    const playerInMatch = match.getPlayerById(playerInUpdate.id);
    playerInMatch.data = playerInUpdate;
  }
};
