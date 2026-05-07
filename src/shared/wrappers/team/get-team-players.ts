import type { MatchRules } from "shared/schemas/match-rules";
import type { PlayerInMatch } from "shared/types/server-match-state";
import type { WWReadOnly } from "shared/types/ww-readonly";

export const getTeamPlayers = (
  teamIndex: number,
  rules: MatchRules,
  players: readonly WWReadOnly<PlayerInMatch>[],
): PlayerInMatch[] => {
  // get all keys of teamMapping with value of teamIndex
  const playerSlotsInTeam = new Set(
    rules.teamMapping
      .map((team, index) => (team === teamIndex ? index : undefined))
      .filter((index): index is number => index !== undefined),
  );

  return players.filter((p) => playerSlotsInTeam.has(p.slot));
};
