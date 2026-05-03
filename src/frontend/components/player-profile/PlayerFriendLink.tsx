import Link from "next/link";
import type { Army } from "shared/schemas/army";
import type { CO } from "shared/schemas/co";

interface Props {
  friendName: string;
  friendFavCO: CO;
  friendFavArmy: Army;
}

export function PlayerFriendLink({ friendName, friendFavArmy, friendFavCO }: Props) {
  return (
    <Link
      className="tw:grid tw:grid-cols-6 tw:smallscreen:grid-cols-10 tw:laptop:grid-cols-6 tw:w-full tw:space-x-4 tw:justify-start tw:items-center tw:align-middle tw:text-white  tw:border-4 tw:border-transparent tw:bg-transparent tw:hover:text-white tw:hover:bg-white/10"
      href={`/players/${friendName}`}
    >
      <div
        className={`tw:bg-black @border-${friendFavArmy} tw:border-[3px] tw:min-h-4 tw:min-w-4 tw:monitor:min-h-12 tw:monitor:min-w-12`}
      >
        <img
          className="tw:min-w-full tw:[image-rendering:pixelated]"
          src={`/img/CO/pixelated/${friendFavCO}-small.png`}
          alt={friendFavCO}
        />
      </div>
      <h3 className="tw:col-span-5 tw:font-medium tw:text-lg tw:smallscreen:text-xl">{friendName}</h3>
    </Link>
  );
}
