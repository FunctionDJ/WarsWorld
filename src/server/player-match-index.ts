import type { Player } from "generated/client";
import type { PlayerInSetup } from "shared/server-match-state";
import { safeRemoveFromArray, throwIfUndefined } from "shared/throw-helper";
import type { MatchWrapper } from "shared/wrappers/match";
import type { MatchInSetup } from "shared/wrappers/match-in-setup";
import type { PlayerInMatchWrapper } from "shared/wrappers/player-in-match";

class PlayerMatchIndex {
  private readonly index = new Map<Player["id"], (MatchWrapper | MatchInSetup)[]>();

  getPlayerMatches(playerId: Player["id"]): readonly (MatchWrapper | MatchInSetup)[] | undefined {
    return this.index.get(playerId);
  }

  onPlayerJoin(player: PlayerInSetup, match: MatchWrapper | MatchInSetup): void {
    const playerMatches = this.index.get(player.id);

    if (playerMatches === undefined) {
      this.index.set(player.id, [match]);
    } else {
      playerMatches.push(match);
    }
  }

  onPlayerLeave(player: PlayerInMatchWrapper | { matchId: string; player: PlayerInSetup }): void {
    const playerId = "data" in player ? player.data.id : player.player.id;
    const matchId = "data" in player ? player.match.id : player.matchId;

    //Lets get all the matches this player is on
    const playerMatches = throwIfUndefined(
      this.index.get(playerId),
      `Tried to get matches for player ${playerId} from playerIdIndex but index entry wasn't found`,
    );

    safeRemoveFromArray(playerMatches, (m) => m.id === matchId);

    if (playerMatches.length === 0) {
      this.index.delete(playerId);
    }
  }
}

export const playerMatchIndex = new PlayerMatchIndex();
