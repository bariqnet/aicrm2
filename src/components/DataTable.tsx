import { cn } from "@/lib/utils";

type DataTableColumn<TRow> = {
  key: string;
  label: string;
  render: (row: TRow) => React.ReactNode;
  className?: string;
};

type DataTableProps<TRow extends { id: string | number }> = {
  columns: DataTableColumn<TRow>[];
  rows: TRow[];
  onRowClick?: (row: TRow) => void;
};

export function DataTable<TRow extends { id: string | number }>({
  columns,
  rows,
  onRowClick
}: DataTableProps<TRow>) {
  return (
    <div className="table-shell">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-surface2 text-xs uppercase tracking-[0.1em] text-mutedfg">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={cn("px-3 py-2 font-medium", col.className)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="cursor-pointer border-t border-border transition hover:bg-muted/40"
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn("px-3 py-2", col.className)}>
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
