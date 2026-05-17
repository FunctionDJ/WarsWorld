import type { LeagueType, WWMap } from "generated/browser";
import type { MatchRules } from "shared/schemas/match-rules";
import type { PositionedTile } from "shared/schemas/tile";
import type { UnitData } from "shared/schemas/unit-schemas";
import type { PlayerInMatch } from "shared/server-match-state";
import { MatchWrapper } from "shared/wrappers/match";

export const createPlayerInMatch = (
	overrides: Partial<PlayerInMatch> & { slot: number },
): PlayerInMatch => ({
	name: "",
	type: "player-in-match",
	status: "alive",
	army: "orange-star",
	coId: {
		name: "andy",
		version: "AW1",
		...overrides.coId,
	},
	COPowerState: "no-power",
	funds: 0,
	id: "0",
	powerMeter: 0,
	timesPowerUsed: 0,
	hasCurrentTurn: true,
	...overrides,
});

const simpleMap: WWMap = {
	id: "0",
	createdAt: new Date(),
	name: "",
	numberOfPlayers: 0,
	predeployedUnits: [],
	tiles: [
		[
			{ type: "road", variant: "right-left" },
			{ type: "road", variant: "right-left" },
		],
	],
};

type CreateMatchOptions = Partial<{
	leagueType: LeagueType;
	changeableTiles: PositionedTile[];
	rules: Partial<MatchRules>;
	map: Partial<WWMap>;
	units: UnitData[];
	turn: number;
}>;

export const createMatch = (
	players: PlayerInMatch[],
	overrides?: CreateMatchOptions,
): MatchWrapper => {
	const match = new MatchWrapper(
		"",
		{
			unitCapPerPlayer: 0,
			fogOfWar: false,
			fundsPerProperty: 1000,
			labUnitTypes: ["infantry"],
			bannedUnitTypes: [],
			captureLimit: 0,
			dayLimit: 50,
			weatherSetting: "clear",
			teamMapping: [0, 1],
			...overrides?.rules,
		},
		overrides?.map
			? {
					...simpleMap,
					...overrides.map,
				}
			: simpleMap,
		players,
		overrides?.units ?? [],
	);

	match.leagueType = overrides?.leagueType ?? match.leagueType;
	match.changeableTiles = overrides?.changeableTiles ?? match.changeableTiles;
	match.turn = overrides?.turn ?? match.turn;

	return match;
};
