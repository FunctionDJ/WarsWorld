import type { PlayerLeaderboard } from "./LeaderboardData";
import PlayerCard from "./PlayerCard";

interface Props {
  bestPlayers: PlayerLeaderboard[];
}

export default function BestPlayersSection({ bestPlayers }: Props) {
  return (
    <div className="tw:flex tw:flex-row tw:flex-wrap tw:justify-center tw:items-center">
      {bestPlayers.map((player) => {
        return (
          <div
            key={player.id}
            className="tw:w-28 tw:smallscreen:w-56 tw:laptop:w-60 tw:large_monitor:w-[20rem] tw:h-80 tw:smallscreen:h-160 large-monitor:@h-[52rem] tw:mb-8 tw:mx-1 tw:smallscreen:mx-4 tw:large_monitor:mb-16"
          >
            <PlayerCard
              name={player.name}
              rank={player.rank}
              mmr={player.rating}
              country={player.army}
              co={player.co}
              profileLink={player.profileLink}
            />
          </div>
        );
      })}
    </div>
  );
}
