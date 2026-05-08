import type { Player } from "generated/client";
import type { PlayerBeforeMatch } from "shared/types/server-match-state";
import { safeRemoveFromArray, throwIfUndefined } from "shared/types/throw-helper";
import type { MatchWrapper } from "shared/wrappers/match/match";
import type { MatchInSetup } from "shared/wrappers/match/match-in-setup";
import type { PlayerInMatchWrapper } from "shared/wrappers/player/player-in-match";

class PlayerMatchIndex {
  private index = new Map<Player["id"], (MatchWrapper | MatchInSetup)[]>();

  getPlayerMatches(playerId: Player["id"]): (MatchWrapper | MatchInSetup)[] | undefined {
    return this.index.get(playerId);
  }

  onPlayerJoin(player: PlayerBeforeMatch, match: MatchWrapper | MatchInSetup): void {
    const playerMatches = this.index.get(player.id);

    if (playerMatches === undefined) {
      this.index.set(player.id, [match]);
    } else {
      playerMatches.push(match);
    }
  }

  onPlayerLeave(player: PlayerInMatchWrapper): void {
    //Lets get all the matches this player is on
    const playerMatches = throwIfUndefined(
      this.index.get(player.data.id),
      `Tried to get matches for player ${player.data.id} from playerIdIndex but index entry wasn't found`,
    );

    safeRemoveFromArray(playerMatches, (m) => m.id === player.match.id);

    if (playerMatches.length === 0) {
      this.index.delete(player.data.id);
    }
  }
}

export const playerMatchIndex = new PlayerMatchIndex();
