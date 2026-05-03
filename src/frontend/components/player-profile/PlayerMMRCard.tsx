import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { columnsWithMMR } from "frontend/components/player-profile/MMRTableColumns";
import type { PlayerMMR } from "pages/players/[playerName]";
import { MMRDataTable } from "./MMRDataTable";

type Props = {
  leagueType: string;
  data: PlayerMMR[];
  rank: number;
};

export function PlayerMMRCard({ data, leagueType, rank }: Props) {
  const table = useReactTable({
    data,
    columns: columnsWithMMR,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:align-middle tw:w-full">
      <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:align-middle">
        <div className="tw:w-full tw:py-2 tw:text-center tw:uppercase">
          <h3 className="@font-russoOne tw:text-xl tw:monitor:text-2xl">{leagueType}</h3>
        </div>
        <MMRDataTable table={table} />
        <div className="tw:w-full tw:py-2 tw:text-center">
          <p>Rank: #{rank}</p>
        </div>
      </div>
    </div>
  );
}
