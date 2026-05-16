import type { LeagueType, Match, WWMap } from "generated/browser";
import type { MatchRules } from "shared/schemas/match-rules";
import type { PlayerInSetup } from "shared/server-match-state";
import { findOrThrow, safeRemoveFromArray } from "shared/throw-helper";

interface TeamInSetup {
  readonly index: number;
  readonly players: PlayerInSetup[];
}

export class MatchInSetup {
  public readonly type = "match-in-setup";
  private readonly teams: TeamInSetup[] = [];

  constructor(
    public readonly id: Match["id"],
    public readonly leagueType: LeagueType,
    public readonly rules: MatchRules,
    public map: WWMap,
  ) {}

  getAllPlayers(): readonly PlayerInSetup[] {
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

  addPlayer(player: PlayerInSetup, teamIndex: number): void {
    const team = this.getOrCreateTeam(teamIndex);
    team.players.push(player);
  }

  removePlayer(player: PlayerInSetup): void {
    const team = findOrThrow(this.teams, (t) => t.players.some((p) => p.id === player.id));
    safeRemoveFromArray(team.players, (p) => p.id === player.id);

    if (team.players.length === 0) {
      safeRemoveFromArray(this.teams, (t) => t === team);
    }
  }

  findPlayerById(playerId: PlayerInSetup["id"]): PlayerInSetup {
    return findOrThrow(this.getAllPlayers(), (p) => p.id === playerId);
  }
}
