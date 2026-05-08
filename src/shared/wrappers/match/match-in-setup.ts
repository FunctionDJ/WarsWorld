import type { LeagueType, Match, WWMap } from "generated/browser";
import type { MatchRules } from "shared/schemas/match-rules";
import type { PlayerBeforeMatch } from "shared/types/server-match-state";
import type { WWReadOnly } from "shared/types/ww-readonly";

export class MatchInSetup {
  public readonly type = "match-in-setup";
  public readonly state = "setup";

  constructor(
    public readonly id: Match["id"],
    public readonly leagueType: LeagueType,
    public readonly rules: MatchRules,
    public map: WWReadOnly<WWMap>,
    public players: PlayerBeforeMatch[],
  ) {}
}
