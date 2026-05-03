import { createColumnHelper } from "@tanstack/react-table";
import Link from "next/link";
import type { PlayerLeaderboard } from "./LeaderboardData";

const columnHelper = createColumnHelper<PlayerLeaderboard>();

export const columns = [
  columnHelper.accessor("rank", {
    id: "Rank",
    header: () => "Rank",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("rating", {
    id: "Rating",
    header: () => "Rating",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor(
    (row) => (
      <div className="tw:flex tw:space-x-2 tw:smallscreen:space-x-4">
        <img
          className="tw:w-auto tw:h-4 tw:smallscreen:h-6 tw:monitor:h-8 tw:[image-rendering:pixelated]"
          src={`img/nations/${row.army}.gif`}
          alt={row.army}
        />
        <Link
          className="tw:p-0 tw:m-0 tw:text-white tw:hover:text-primary tw:text-[1em]"
          href={row.profileLink}
        >
          {row.name}
        </Link>
      </div>
    ),
    {
      id: "Player",
      header: "Player",
      cell: (info) => info.getValue(),
    },
  ),
  columnHelper.accessor("games", {
    id: "Games",
    header: () => "Games",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("winRate", {
    id: "Win Rate",
    header: () => "Win rate",
    cell: (info) => (
      <div className="tw:relative">
        <div className="tw:text-left tw:pl-4 tw:relative tw:w-full tw:h-full tw:z-10">
          {info.getValue().toFixed(2)} %
        </div>
        <div
          className="tw:w-full tw:h-full tw:absolute tw:left-0 tw:top-0 tw:bg-linear-to-r tw:from-red-600/80 tw:to-primary/80 tw:rounded-2xl tw:z-0 tw:shadow-lg tw:shadow-black"
          style={{ width: `${String(info.getValue())}%` }}
        ></div>
      </div>
    ),
  }),
  columnHelper.accessor("streak", {
    id: "Streak",
    header: () => "Streak",
    cell: (info) => (
      <>
        {info.getValue() > 0 ? (
          <div>{`${String(info.getValue())} ${info.getValue() > 10 ? "🔥" : ""}`}</div>
        ) : (
          <div className="tw:flex @flex-column tw:items-center tw:justify-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 14.375L18.526 8.6792L17.7409 9.46429L12.5 3.82069L5 6.875L0 0L3.75 10.625L11.9044 8.08506L15.0893 12.1159L14.3042 12.901L20 14.375ZM4.375 11.7395V20H0.625V12.9076L4.375 11.7395ZM19.375 15.5044V20H15.625V14.5339L19.375 15.5044ZM14.375 14.2104V20H10.625V13.2399L14.375 14.2104ZM9.375 10.1821V20H5.625V11.3502L9.375 10.1821Z"
                fill="#E7724C"
              />
            </svg>
          </div>
        )}
      </>
    ),
  }),
];
