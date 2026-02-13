import { cn } from "@/lib/utils";

export function DataTable({
  columns,
  rows,
  onRowClick
}: {
  columns: { key: string; label: string; render: (row: any) => React.ReactNode; className?: string }[];
  rows: any[];
  onRowClick?: (row: any) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/60 text-xs uppercase tracking-wide text-zinc-500">
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
            <tr key={row.id} className="cursor-pointer border-t hover:bg-muted/40" onClick={() => onRowClick?.(row)}>
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
