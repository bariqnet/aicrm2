import { Activity } from "@/lib/types";
import { fmtDate } from "@/lib/utils";

export function Timeline({ activities }: { activities: Activity[] }) {
  return (
    <div className="space-y-3">
      {activities.map((a) => (
        <div key={a.id} className="rounded-lg border p-3">
          <p className="text-xs uppercase text-zinc-500">{a.type}</p>
          <p className="font-medium">{a.subject}</p>
          <p className="text-sm text-zinc-500">{a.summary}</p>
          <p className="mt-1 text-xs text-zinc-400">{fmtDate(a.occurredAt)} · {a.actor}</p>
        </div>
      ))}
    </div>
  );
}
