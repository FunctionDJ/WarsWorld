/* eslint-disable @typescript-eslint/no-namespace */
// ^ couldn't find a way around using namespaces yet
// https://www.npmjs.com/package/prisma-json-types-generator#configuration

import type { MainEventWithSubEvents } from "shared/events";
import type { MatchRules } from "shared/schemas/match-rules";
import type { Preferences } from "shared/schemas/preferences";
import type { Tile } from "shared/schemas/tile";
import type { UnitData } from "shared/schemas/unit-schemas";
import type { PlayerInMatch, PlayerInSetup } from "shared/server-match-state";

declare global {
	namespace PrismaJson {
		type PrismaPreferences = Preferences;
		type PrismaTiles = Tile[][];
		type PrismaUnits = UnitData[];
		type PrismaPlayerState =
			| { type: "players-in-match"; players: readonly PlayerInMatch[] }
			| { type: "players-in-setup"; players: readonly PlayerInSetup[] };
		type PrismaEvent = MainEventWithSubEvents;
		type PrismaMatchRules = MatchRules;
	}
}
