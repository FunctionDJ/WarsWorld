import type { Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";

interface Props {
  // Need any or another generic type to make this component work with any table
  // regardless of what type the data has.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: Table<any>;
}

const TableHeaderColorsWithMMR: Record<number, string> = {
  0: "tw:bg-primary tw:text-white",
  1: "tw:bg-black/80 tw:text-green-earth",
  2: "tw:bg-black/80 tw:text-orange-star",
  3: "tw:bg-black/80 tw:text-bg-tertiary",
};

const TableHeaderColors: Record<number, string> = {
  0: "tw:bg-black/80 tw:text-green-earth",
  1: "tw:bg-black/80 tw:text-orange-star",
  2: "tw:bg-black/80 tw:text-bg-tertiary",
};

export function MMRDataTable({ table }: Props) {
  return (
    <table className="tw:w-full tw:bg-black/50 tw:shadow-lg tw:shadow-black tw:rounded-lg tw:overflow-hidden">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                className={`@py-2 @uppercase @min-w-16 ${
                  headerGroup.headers[0].id === "MMR"
                    ? TableHeaderColorsWithMMR[header.index]
                    : TableHeaderColors[header.index]
                }
                ${header.column.id === "MMR" && "tw:border-r-4"}`}
                key={header.id}
              >
                <h3 className="@font-russoOne tw:text-lg">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </h3>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td
                className={`@p-1 monitor:@p-2 @text-center ${
                  cell.id === "0_MMR" ? "tw:bg-bg-secondary tw:border-r-4" : ""
                }`}
                key={cell.id}
              >
                <div className={`tw:px-1 tw:text-lg`}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
