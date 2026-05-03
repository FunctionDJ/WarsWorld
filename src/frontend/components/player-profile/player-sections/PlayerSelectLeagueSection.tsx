import type { SelectOption } from "frontend/components/layout/Select";
import Select from "frontend/components/layout/Select";
import type { PlayerMMR } from "pages/players/[playerName]";
import { useState } from "react";
import { SmallMatchCard } from "../SmallMatchCard";

const gamemodes: SelectOption[] = [
  { label: "Standard Live", value: 0 },
  { label: "Standard", value: 1 },
  { label: "Fog of War", value: 2 },
  { label: "Fog of War Live", value: 3 },
  { label: "High Funds", value: 4 },
  { label: "High Funds Live", value: 5 },
];

interface Props {
  playerMMRArray: PlayerMMR[] | undefined;
}

export function PlayerSelectLeagueSection({ playerMMRArray }: Props) {
  const [gamemode, setGamemode] = useState<SelectOption | undefined>({
    label: "Standard Live",
    value: 0,
  });

  const currentLeague = playerMMRArray?.find((league) => league.leagueType === gamemode?.label);

  return (
    <section className="tw:pb-8 tw:py-8 tw:laptop:py-0 tw:laptop:pb-4 tw:px-4 tw:smallscreen:px-6 tw:laptop:px-8 tw:h-full tw:w-full tw:bg-black/60 tw:my-4 tw:space-y-4">
      <div className="tw:grid tw:smallscreen:grid-cols-4">
        <Select
          className="tw:smallscreen:col-span-2 tw:laptop:col-span-1 tw:self-center tw:h-10 tw:monitor:h-12 tw:order-2 tw:smallscreen:order-1"
          options={gamemodes}
          onChange={(o) => {
            setGamemode(o);
          }}
          value={gamemode}
        />
        <h1 className="tw:smallscreen:col-span-2 tw:laptop:col-span-3 @font-russoOne tw:smallscreen:px-16 tw:uppercase tw:order-1 tw:smallscreen:order-2">
          {currentLeague?.leagueType}
        </h1>
      </div>
      <div className="tw:grid tw:smallscreen:grid-cols-8 tw:laptop:grid-cols-12 tw:gap-8">
        <div className="tw:flex tw:flex-col tw:col-span-3">
          <h2 className="@font-russoOne tw:text-2xl tw:monitor:text-4xl tw:my-2">
            Rank: #{currentLeague?.rank}
          </h2>
          <p className="@font-russoOne tw:text-xl tw:monitor:text-2xl">MMR: {currentLeague?.mmr}</p>
          <p className="@font-russoOne tw:text-xl tw:monitor:text-2xl">
            Max MMR: {currentLeague?.topMmr}
          </p>
          <p className="tw:text-sm tw:monitor:text-lg">Last game: 06/29/2023</p>
          <div className="tw:mt-4">
            <p className="@font-russoOne tw:text-xl tw:text-green-earth tw:monitor:text-2xl">
              WINS: <span className="tw:text-white">{currentLeague?.wins}</span>
            </p>
            <p className="@font-russoOne tw:text-xl tw:text-orange-star tw:monitor:text-2xl">
              LOSES: <span className="tw:text-white">{currentLeague?.losses}</span>
            </p>
            <p className="@font-russoOne tw:text-xl tw:text-bg-tertiary tw:monitor:text-2xl">
              DRAWS: <span className="tw:text-white">{currentLeague?.draws}</span>
            </p>
          </div>
        </div>
        <div className="tw:flex tw:flex-col tw:h-full tw:p-2 tw:col-span-5">
          <div className="tw:w-full tw:h-56 tw:smallscreen:h-full tw:border-primary tw:border-4 tw:bg-bg-secondary tw:text-center">
            GRAPH
          </div>
        </div>
        <div className="tw:grid tw:grid-rows-5 tw:gap-4 tw:monitor:gap-6 tw:h-full tw:col-span-5 tw:smallscreen:col-span-8 tw:laptop:col-span-4">
          <SmallMatchCard
            matchResult="W"
            player1={{ co: "grimm", name: "Grimm Guy" }}
            player2={{ co: "eagle", name: "Itou Kaiji" }}
            matchLink="/"
          />
          <SmallMatchCard
            matchResult="L"
            player1={{ co: "koal", name: "Itou Kaiji" }}
            player2={{ co: "grimm", name: "Grimm Guy" }}
            matchLink="/"
          />
          <SmallMatchCard
            matchResult="D"
            player1={{ co: "sasha", name: "CliveGlitch" }}
            player2={{ co: "javier", name: "Itou Kaiji" }}
            matchLink="/"
          />
          <SmallMatchCard
            matchResult="W"
            player1={{ co: "sonja", name: "Itou Kaiji" }}
            player2={{ co: "grimm", name: "Grimm Guy" }}
            matchLink="/"
          />
          <SmallMatchCard
            matchResult="W"
            player1={{ co: "grimm", name: "Grimm Guy" }}
            player2={{ co: "olaf", name: "Itou Kaiji" }}
            matchLink="/"
          />
        </div>
      </div>
    </section>
  );
}
