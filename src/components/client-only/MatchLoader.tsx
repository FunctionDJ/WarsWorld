import { useQuery } from "@tanstack/react-query";
import { FrontendUnit } from "frontend/components/match/frontend-unit";
import type { SpritesheetDataByArmy } from "frontend/components/match/get-spritesheet-data";
import type { ChangeableTileWithSprite } from "frontend/components/match/types";
import { trpc } from "frontend/utils/trpc-client";
import { loadSpritesFromSpriteMap } from "pixi/load-spritesheet";
import { useEffect, useState } from "react";
import { MatchWrapper } from "shared/wrappers/match/match";
import { MatchRenderer } from "./MatchRenderer";

interface Props {
  matchId: string;
  playerId: string;
  spritesheetDataByArmy: SpritesheetDataByArmy;
}

export function MatchLoader({ matchId, playerId, spritesheetDataByArmy }: Props) {
  const spriteSheetQuery = useQuery({
    queryKey: ["spritesheets"],
    queryFn: () => loadSpritesFromSpriteMap(spritesheetDataByArmy),
  });

  const [turn, setTurn] = useState<boolean>(false);

  const fullMatchQuery = trpc.match.full.useQuery(
    { matchId, playerId },
    {
      refetchIntervalInBackground: false,
      refetchOnReconnect: true,
      //refetchInterval: 10000,
      refetchOnWindowFocus: true,
      select(match) {
        return new MatchWrapper<ChangeableTileWithSprite, FrontendUnit>(
          match.id,
          match.leagueType,
          match.changeableTiles.map((tile) => ({ ...tile })),
          match.rules,
          match.status,
          match.map,
          match.players,
          match.units,
          FrontendUnit,
          match.turn,
        );
      },
    },
  );

  // Add useEffect to trigger refetch when turn changes
  useEffect(
    () => {
      void fullMatchQuery.refetch();
    }, //Adding all dependencies here causes an infinite loop
    /* eslint-disable */ [turn],
  );

  if (fullMatchQuery.isError || spriteSheetQuery.isError) {
    return <p>error {":("}</p>;
  }

  if (fullMatchQuery.isPending || spriteSheetQuery.isPending) {
    return <p>Loading match data...</p>;
  }

  const player = fullMatchQuery.data.getPlayerById(playerId);

  if (player === undefined) {
    throw new Error("Could not find player by playerId in match wrapper in MatchLoader");
  }

  return (
    <div className="tw:w-full tw:h-full tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-4">
      <MatchRenderer
        match={fullMatchQuery.data}
        spriteSheets={spriteSheetQuery.data}
        turn={turn}
        setTurn={setTurn}
        player={player}
      />
    </div>
  );
}
