import { ReactNode } from "react";

export interface Column<T> {
  header: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
}

export function Table<T>({ columns, rows, rowKey, onRowClick }: Props<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-border">
            {columns.map((col) => (
              <th
                key={col.header}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
                  col.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-slate-100 last:border-0 ${
                onRowClick ? "cursor-pointer hover:bg-surface" : ""
              }`}
            >
              {columns.map((col) => (
                <td
                  key={col.header}
                  className={`px-4 py-2.5 text-slate-700 ${col.align === "right" ? "text-right tabular-nums" : ""}`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
