import Link from "next/link";
import type { Army } from "shared/schemas/army";

interface Props {
  rank: number;
  name: string;
  mmr: number;
  co: string;
  country: Army;
  profileLink: string;
}

export default function PlayerCard({ rank, name, mmr, co, country, profileLink }: Props) {
  return (
    <Link href={profileLink} className="tw:text-white tw:hover:text-white">
      <div className="tw:relative tw:w-full tw:h-full tw:bg-black/50 tw:shadow-black/80 tw:shadow-lg tw:rounded-lg tw:overflow-hidden tw:hover:scale-105 tw:duration-75">
        <img
          className="tw:absolute tw:scale-[1.2] tw:top-8 tw:left-2 tw:smallscreen:left-4 tw:smallscreen:top-16"
          src={`img/CO/smoothFull/Awds-${co}.webp`}
          alt={co}
        />
        <div className="tw:absolute tw:bottom-0 tw:right-0 tw:w-full tw:h-12 tw:smallscreen:h-16 tw:laptop:h-20 tw:large_monitor:h-32 tw:bg-bg-tertiary">
          <div className="tw:flex tw:absolute tw:bottom-6 tw:smallscreen:bottom-8 tw:laptop:bottom-10 tw:large_monitor:bottom-16 tw:right-0 tw:w-full tw:h-6 tw:smallscreen:h-8 tw:laptop:h-10 tw:large_monitor:h-16">
            <div className="tw:flex tw:w-full tw:h-full tw:items-center tw:justify-center">
              <h4 className="tw:text-[0.9em] tw:large_monitor:text-[1.2em]"># {rank}</h4>
            </div>
            <img
              className="tw:h-full tw:m-[2px] tw:large_monitor:m-[4px] tw:[image-rendering:pixelated]"
              src={`img/nations/${country}.gif`}
              alt=""
            />
            <div className="tw:flex tw:w-full tw:h-full tw:items-center tw:justify-center">
              <h4 className="tw:text-[0.9em] tw:large_monitor:text-[1.25em]">{mmr}</h4>
            </div>
          </div>
          <div className="tw:flex tw:absolute tw:bottom-0 tw:w-full tw:h-6 tw:smallscreen:h-8 tw:laptop:h-10 tw:large_monitor:h-16 tw:bg-white">
            <div
              className={`tw:flex tw:w-full tw:h-full tw:items-center tw:justify-center ${"@bg-" + country}`}
            >
              <h4 className="tw:font-medium tw:text-[0.7em] tw:smallscreen:text-[0.85em] tw:large_monitor:text-[1.1em]">
                {name}
              </h4>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
