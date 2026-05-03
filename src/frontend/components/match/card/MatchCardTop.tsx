import type { MatchStatus } from "@prisma/client";

interface matchData {
  //players: PlayerInMatch[];
  mapName: string;
  day: number;
  state: MatchStatus;
  favorites: number;
  spectators: number;
  time: number;
}

export default function MatchCardTop({ mapName, day, state }: matchData) {
  return (
    <>
      <div className="tw:grid  tw:grid-cols-12 tw:items-center tw:text-center tw:justify-center tw:outline tw:outline-black tw:outline-2 tw:bg-bg-primary tw:h-max ">
        <div className="tw:col-span-10 tw:bg-bg-tertiary tw:px-4 tw:text-left">
          <p>{mapName}</p>
        </div>
        <div className="tw:col-span-2 tw:bg-match-orange tw:uppercase ">
          <p>Day {day}</p>
        </div>
      </div>

      <div className="tw:grid  tw:grid-cols-[repeat(auto-fit,minmax(50px,1fr))] tw:items-center tw:justify-center tw:outline tw:outline-black tw:outline-2 tw:bg-bg-primary tw:h-max">
        {state == "setup" ? (
          <div className="tw:col-span-2  tw:bg-secondary tw:text-black tw:font-bold ">SETUP</div>
        ) : (
          <div className="tw:col-span-2 tw:bg-bg-match-live tw:font-bold ">
            <img className="tw:h-4 tw:inline-block" src="/img/matchCard/liveDot.png" alt="live dot" />
            LIVE
          </div>
        )}

        {
          //TODO: This needs to actually grab the gamemode
        }
        <div className="tw:col-span-1 ">STD</div>

        <div className="tw:col-span-1 tw:bg-bg-secondary">
          <img className="tw:h-4 tw:inline-block" src="/img/matchCard/eye.png" alt="eye" /> 0
        </div>

        <div className="tw:col-span-1  ">
          <img className="tw:h-4 tw:inline-block " src="/img/matchCard/star.png" alt="star" /> 0
        </div>
        <div className="tw:col-span-2 tw:bg-bg-secondary">
          <img className="tw:h-4 tw:inline-block " src="/img/matchCard/clock.png" alt="clock" /> 15m:00s
        </div>
      </div>
    </>
  );
}
