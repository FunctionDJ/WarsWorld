/* eslint-disable @typescript-eslint/no-namespace */
// ^ couldn't find a way around using namespaces yet
// https://www.npmjs.com/package/prisma-json-types-generator#configuration

import type { MatchRules } from "shared/schemas/match-rules";
import type { Preferences } from "shared/schemas/preferences";
import type { PassableTile } from "shared/schemas/tile";
import type { UnitWithVisibleStats } from "shared/schemas/unit";
import type { MainEventWithSubEvents } from "shared/types/events";
import type { PlayerBeforeMatch, PlayerInMatch } from "shared/types/server-match-state";

declare global {
  namespace PrismaJson {
    type PrismaPreferences = Preferences;
    type PrismaTiles = PassableTile[][];
    type PrismaUnits = UnitWithVisibleStats[];
    type PrismaPlayerState =
      | { type: "players-in-match"; players: readonly PlayerInMatch[] }
      | { type: "players-in-setup"; players: readonly PlayerBeforeMatch[] };
    type PrismaEvent = MainEventWithSubEvents;
    type PrismaMatchRules = MatchRules;
  }
}
