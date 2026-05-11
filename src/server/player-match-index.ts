import type { Player } from "generated/client";
import type { PlayerBeforeMatch } from "shared/types/server-match-state";
import { safeRemoveFromArray, throwIfUndefined } from "shared/types/throw-helper";
import type { MatchWrapper } from "shared/wrappers/match/match";
import type { MatchInSetup } from "shared/wrappers/match/match-in-setup";
import type { PlayerInMatchWrapper } from "shared/wrappers/player/player-in-match";

class PlayerMatchIndex {
  private readonly index = new Map<Player["id"], (MatchWrapper | MatchInSetup)[]>();

  getPlayerMatches(playerId: Player["id"]): readonly (MatchWrapper | MatchInSetup)[] | undefined {
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

  onPlayerLeave(
    player: PlayerInMatchWrapper | { matchId: string; player: PlayerBeforeMatch },
  ): void {
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
