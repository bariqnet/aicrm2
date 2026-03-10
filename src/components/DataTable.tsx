import { cn } from "@/lib/utils";

type DataTableColumn<TRow> = {
  key: string;
  label: string;
  render: (row: TRow) => React.ReactNode;
  className?: string;
  headerClassName?: string;
};

type DataTableProps<TRow extends { id: string | number }> = {
  className?: string;
  columns: DataTableColumn<TRow>[];
  emptyState?: React.ReactNode;
  footer?: React.ReactNode;
  rows: TRow[];
  getRowClassName?: (row: TRow) => string | undefined;
};

export function DataTable<TRow extends { id: string | number }>({
  className,
  columns,
  emptyState,
  footer,
  getRowClassName,
  rows,
}: DataTableProps<TRow>) {
  return (
    <div className={cn("table-shell overflow-x-auto", className)}>
      <table className="min-w-[720px]">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={cn(col.headerClassName, col.className)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-4 py-12 text-center text-sm text-mutedfg" colSpan={columns.length}>
                {emptyState ?? "No records found."}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className={cn(getRowClassName?.(row))}>
                {columns.map((col) => (
                  <td key={col.key} className={cn(col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {footer ? (
        <div className="border-t border-border/80 px-5 py-3 text-sm text-mutedfg">{footer}</div>
      ) : null}
    </div>
  );
}
