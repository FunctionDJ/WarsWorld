import type { Match, WWMap } from "generated/client";
import { prisma } from "server/prisma/prisma-client";
import { arrayAtOrThrow } from "shared/array-utilities";
import { Position } from "shared/schemas/position";
import type { MatchInSetup } from "shared/wrappers/match/match-in-setup";
import { MutableMatch } from "shared/wrappers/match/mutable-match";
import { MutableUnit } from "shared/wrappers/unit/mutable-unit";
import {
  applyMainEventToMatch,
  applySubEventToMatch,
} from "../shared/match-logic/events/apply-event-to-match";
import { willBeChangeableTile } from "../shared/schemas/tile-utilities";
import type { ChangeableTile } from "../shared/types/server-match-state";
import { pageMatchIndex } from "./page-match-index";
import { playerMatchIndex } from "./player-match-index";

const getChangeableTilesFromMap = (map: WWMap): ChangeableTile[] => {
  const changeableTiles: ChangeableTile[] = [];

  for (let y = 0; y < map.tiles.length; y++) {
    for (let x = 0; x < arrayAtOrThrow(map.tiles, y).length; x++) {
      const tile = arrayAtOrThrow(arrayAtOrThrow(map.tiles, y), x);
      const position = new Position([x, y]);

      if (willBeChangeableTile(tile)) {
        if (tile.type === "unusedSilo") {
          changeableTiles.push({
            type: tile.type,
            position,
            fired: false,
          });
        } else if (tile.type === "pipeSeam") {
          changeableTiles.push({
            type: tile.type,
            position,
            hp: 99,
          });
        } else {
          changeableTiles.push({
            type: tile.type,
            position,
            playerSlot: tile.playerSlot,
          });
        }
      }
    }
  }

  return changeableTiles;
};

export class MatchStore {
  private index = new Map<Match["id"], MutableMatch | MatchInSetup>();

  createMatchAndIndex(rawMatch: Match, rawMap: WWMap): MutableMatch {
    const match = new MutableMatch(
      rawMatch.id,
      rawMatch.leagueType,
      getChangeableTilesFromMap(rawMap),
      rawMatch.rules,
      rawMatch.status,
      rawMap,
      rawMatch.playerState,
      rawMap.predeployedUnits,
      MutableUnit,
      0,
    );

    this.index.set(match.id, match);

    for (const player of match.getAllPlayers()) {
      playerMatchIndex.onPlayerJoin(player);
    }

    pageMatchIndex.addMatch(match);

    return match;
  }

  async rebuild(): Promise<void> {
    console.log("Rebuilding server state...");

    const rawMatches = await prisma.match.findMany({
      where: {
        status: {
          not: "finished",
        },
      },
      include: {
        map: true,
        Event: true,
      },
    });

    for (const rawMatch of rawMatches) {
      const match = this.createMatchAndIndex(rawMatch, rawMatch.map);
      for (const databaseEvent of rawMatch.Event) {
        applyMainEventToMatch(match, databaseEvent.content);

        if (databaseEvent.content.type === "move") {
          applySubEventToMatch(match, databaseEvent.content);
        }
      }
    }

    console.log("Rebuilding server state done.");
  }

  get(matchId: Match["id"]): MutableMatch | MatchInSetup | undefined {
    return this.index.get(matchId);
  }

  removeMatchFromIndex(match: MutableMatch | MatchInSetup): void {
    this.index.delete(match.id);
  }
}

export const matchStore = new MatchStore();
