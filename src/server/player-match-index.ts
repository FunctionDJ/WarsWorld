import type { Player } from "generated/client";
import type { PlayerBeforeMatch } from "shared/types/server-match-state";
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
    const playerMatches = this.index.get(player.data.id);

    if (playerMatches === undefined) {
      throw new Error(
        `Tried to remove a match for player ${player.data.id} from playerIdIndex but index entry wasn't found`,
      );
    }

    const matchIndex = playerMatches.findIndex((m) => m.id === player.match.id);

    if (matchIndex === -1) {
      throw new Error(
        `Tried to remove match ${player.match.id} for player ${player.data.id} from playerIdIndex but match wasn't found in index`,
      );
    }

    playerMatches.splice(matchIndex, 1);

    if (playerMatches.length === 0) {
      this.index.delete(player.data.id);
    }
  }
}

export const playerMatchIndex = new PlayerMatchIndex();
