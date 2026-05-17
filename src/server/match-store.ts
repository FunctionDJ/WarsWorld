import type { Match, WWMap } from "generated/client";
import { prisma } from "server/prisma/prisma-client";
import { arrayAtOrThrow } from "shared/array-utilities";
import { Position } from "shared/schemas/position";
import type { PositionedTile } from "shared/schemas/tile";
import { throwIfUndefined } from "shared/throw-helper";
import { MatchWrapper } from "shared/wrappers/match";
import { MatchInSetup } from "shared/wrappers/match-in-setup";
import {
	applyMainEventToMatch,
	applySubEventToMatch,
} from "../shared/match-logic/events/apply-event-to-match";
import { pageMatchIndex } from "./page-match-index";
import { playerMatchIndex } from "./player-match-index";

const getChangeableTilesFromMap = (map: WWMap): readonly PositionedTile[] => {
	const positionedTiles: PositionedTile[] = [];

	for (let y = 0; y < map.tiles.length; y++) {
		for (let x = 0; x < arrayAtOrThrow(map.tiles, y).length; x++) {
			const tile = arrayAtOrThrow(arrayAtOrThrow(map.tiles, y), x);
			const position = new Position([x, y]);

			if (
				tile.type === "city" ||
				tile.type === "base" ||
				tile.type === "airport" ||
				tile.type === "port" ||
				tile.type === "lab" ||
				tile.type === "commtower" ||
				tile.type === "hq" ||
				tile.type === "unusedSilo" ||
				tile.type === "pipeSeam"
			) {
				if (tile.type === "unusedSilo") {
					positionedTiles.push({
						type: tile.type,
						position,
					});
				} else if (tile.type === "pipeSeam") {
					positionedTiles.push({
						type: tile.type,
						position,
						hp: 99,
						variant: tile.variant,
					});
				} else {
					positionedTiles.push({
						type: tile.type,
						position,
						playerSlot: tile.playerSlot,
						hp: 20,
					});
				}
			}
		}
	}

	return positionedTiles;
};

export class MatchStore {
	private readonly index = new Map<Match["id"], MatchWrapper | MatchInSetup>();

	createMatchInSetupAndIndex(rawMatch: Match, rawMap: WWMap): MatchInSetup {
		const matchInSetup = new MatchInSetup(rawMatch.id, rawMatch.leagueType, rawMatch.rules, rawMap);

		for (const player of rawMatch.playerState.players.filter((p) => p.type === "player-in-setup")) {
			// [tooling]
			/**
			 * this call counts for fallow
			 */
			matchInSetup.addPlayer(player, 0); // TODO team index
		}

		this.index.set(rawMatch.id, matchInSetup);
		// [missing-implementation] playerMatchIndex
		return matchInSetup;
	}

	createMatchAndIndex(rawMatch: Match, rawMap: WWMap): MatchWrapper {
		const match = new MatchWrapper(
			rawMatch.id,
			rawMatch.rules,
			rawMap,
			rawMatch.playerState.type === "players-in-match" ? rawMatch.playerState.players : [],
			rawMap.predeployedUnits,
		);

		match.leagueType = rawMatch.leagueType;
		match.state = rawMatch.status;
		match.changeableTiles = getChangeableTilesFromMap(rawMap);

		if (rawMatch.playerState.type === "players-in-setup") {
			for (const player of rawMatch.playerState.players) {
				// [correctness] this check needs to happen on set-read or something
				// and we may need a different type that expresses the state of "players in setup but everything selected like coId"
				const definedCoId = throwIfUndefined(player.coId, "Player in setup missing coId");
				const definedArmy = throwIfUndefined(player.army, "Player in setup missing army");

				match.addUnwrappedPlayer({
					type: "player-in-match",
					id: player.id,
					name: player.name,
					coId: definedCoId,
					slot: player.slot,
					COPowerState: "no-power",
					army: definedArmy,
					funds: 0,
					hasCurrentTurn: false,
					powerMeter: 0,
					status: "alive",
					timesPowerUsed: 0,
				});
			}
		}

		this.index.set(match.id, match);

		for (const player of match.getAllPlayers()) {
			playerMatchIndex.onPlayerJoin(
				{
					type: "player-in-setup",
					id: player.data.id,
					name: player.data.name,
					ready: false,
					coId: player.data.coId,
					slot: player.data.slot,
				},
				match,
			);
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

	get(matchId: Match["id"]): MatchWrapper | MatchInSetup | undefined {
		return this.index.get(matchId);
	}

	removeMatchFromIndex(match: MatchWrapper | MatchInSetup): void {
		this.index.delete(match.id);
	}
}

export const matchStore = new MatchStore();
