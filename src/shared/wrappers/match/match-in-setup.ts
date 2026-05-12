import type { LeagueType, Match, WWMap } from "generated/browser";
import type { MatchRules } from "shared/schemas/match-rules";
import type { PlayerBeforeMatch } from "shared/types/server-match-state";
import { findOrThrow, safeRemoveFromArray } from "shared/types/throw-helper";
import type { RO } from "shared/types/ww-readonly";

interface TeamInSetup {
  readonly index: number;
  readonly players: PlayerBeforeMatch[];
}

export class MatchInSetup {
  public readonly type = "match-in-setup";
  private readonly teams: TeamInSetup[] = [];

  constructor(
    public readonly id: Match["id"],
    public readonly leagueType: LeagueType,
    public readonly rules: MatchRules,
    public map: RO<WWMap>,
  ) {}

  getAllPlayers(): readonly PlayerBeforeMatch[] {
    return this.teams.flatMap((team) => team.players);
  }

  getTeams(): readonly TeamInSetup[] {
    return this.teams;
  }

  private getOrCreateTeam(teamIndex: number): TeamInSetup {
    const team = this.teams.find((t) => t.index === teamIndex);

    if (team !== undefined) {
      return team;
    }

    const newTeam: TeamInSetup = {
      index: teamIndex,
      players: [],
    };

    this.teams.push(newTeam);
    return newTeam;
  }

  addPlayer(player: PlayerBeforeMatch, teamIndex: number): void {
    const team = this.getOrCreateTeam(teamIndex);
    team.players.push(player);
  }

  removePlayer(player: PlayerBeforeMatch): void {
    const team = this.teams.find((t) => t.players.some((p) => p.id === player.id));

    if (team === undefined) {
      throw new Error("Player not found in any team");
    }

    safeRemoveFromArray(team.players, (p) => p.id === player.id);

    if (team.players.length === 0) {
      safeRemoveFromArray(this.teams, (t) => t === team);
    }
  }

  findPlayerById(playerId: PlayerBeforeMatch["id"]): PlayerBeforeMatch {
    return findOrThrow(this.getAllPlayers(), (p) => p.id === playerId);
  }
}
