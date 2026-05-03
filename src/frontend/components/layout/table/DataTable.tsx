import type { Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";

interface Props {
  // Need any or another generic type to make this component work with any table
  // regardless of what type the data has.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: Table<any>;
  hasFooter?: boolean;
}

export default function DataTable({ table, hasFooter = false }: Props) {
  return (
    <table className="tw:w-full tw:bg-black/50 tw:shadow-lg tw:shadow-black">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr className="tw:bg-bg-secondary" key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                className={`@py-2 @border-b-2 @uppercase ${
                  header.index % 2 === 0 ? "tw:bg-bg-tertiary" : ""
                }`}
                key={header.id}
              >
                <h3 className="tw:font-medium">
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
          <tr className={row.index % 2 === 0 ? "tw:bg-black/40" : ""} key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td className="tw:p-2 tw:smallscreen:p-3 tw:smallscreen:pl-4 tw:text-center" key={cell.id}>
                <div className="tw:px-1 tw:text-[0.75em] tw:smallscreen:text-[1em] tw:monitor:text-[1.35em] tw:large_monitor:text-[1.5em]">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {hasFooter && (
        <tfoot>
          {table.getFooterGroups().map((footerGroup) => (
            <tr className="tw:bg-bg-secondary" key={footerGroup.id}>
              {footerGroup.headers.map((header) => (
                <th
                  className={`@py-2 @border-t-2 @uppercase ${
                    header.index % 2 === 0 ? "tw:bg-bg-tertiary" : ""
                  }`}
                  key={header.id}
                >
                  <h3 className="tw:font-medium">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.footer, header.getContext())}
                  </h3>
                </th>
              ))}
            </tr>
          ))}
        </tfoot>
      )}
    </table>
  );
}
