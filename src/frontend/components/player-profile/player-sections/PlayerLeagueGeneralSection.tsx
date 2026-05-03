import type { PlayerMMR } from "pages/players/[playerName]";
import { PlayerMMRCard } from "../PlayerMMRCard";

interface Props {
  playerLeaguesMMR: PlayerMMR[] | undefined;
}

export function PLayerLeagueGeneralSection({ playerLeaguesMMR }: Props) {
  return (
    <section className="tw:grid tw:smallscreen:grid-cols-2 tw:laptop:grid-cols-3 tw:gap-4 tw:p-8 tw:h-full tw:bg-black/60 tw:my-4">
      {playerLeaguesMMR?.map((league) => {
        return (
          <PlayerMMRCard
            leagueType={league.leagueType}
            rank={league.rank}
            data={[league]}
            key={league.leagueType}
          />
        );
      })}
    </section>
  );
}
