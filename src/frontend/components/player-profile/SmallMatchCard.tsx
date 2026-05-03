import Link from "next/link";
import type { CO } from "shared/schemas/co";

interface SmallMatchCardPlayer {
  co: CO;
  name: string;
}
interface Props {
  matchResult: "W" | "L" | "D";
  player1: SmallMatchCardPlayer;
  player2: SmallMatchCardPlayer;
  matchLink: string;
}

const resultColors = {
  W: "tw:bg-green-earth",
  L: "tw:bg-orange-star",
  D: "tw:bg-bg-tertiary",
};

export function SmallMatchCard({ matchResult, player1, player2, matchLink }: Props) {
  return (
    <Link
      className="tw:flex tw:bg-black/50 tw:text-center tw:text-white tw:cursor-pointer tw:hover:text-white tw:hover:translate-x-2"
      href={matchLink}
    >
      <div
        className={`tw:flex ${resultColors[matchResult]} tw:h-full tw:min-w-12 tw:monitor:min-w-16 @font-russoOne tw:text-2xl tw:monitor:text-4xl tw:align-middle tw:justify-center tw:items-center`}
      >
        <strong>{matchResult}</strong>
      </div>
      <div className="tw:relative tw:flex tw:w-full tw:justify-between tw:items-center">
        <img
          className="tw:[image-rendering:pixelated] tw:h-10 tw:monitor:h-12 tw:opacity-10 tw:px-4"
          src={`/img/CO/pixelated/${player1.co}-small.png`}
          alt={player1.co}
        />
        <p className="tw:absolute tw:bottom-0 tw:px-2 tw:left-0 tw:text-sm tw:bg-transparent">{player1.name}</p>
        <div className="tw:absolute tw:opacity-10 @font-russoOne tw:text-4xl tw:bottom-0 tw:left-1/2 tw:translate-x-[-50%]">
          VS
        </div>
        <img
          className="tw:[image-rendering:pixelated] tw:scale-x-[-1] tw:h-10 tw:monitor:h-12 tw:opacity-10 tw:px-4"
          src={`/img/CO/pixelated/${player2.co}-small.png`}
          alt={player2.co}
        />
        <p className="tw:absolute tw:top-0 tw:px-2 tw:right-0 tw:text-sm tw:bg-transparent">{player2.name}</p>
      </div>
    </Link>
  );
}
