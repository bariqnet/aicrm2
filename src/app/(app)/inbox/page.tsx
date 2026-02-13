"use client";

import { useEffect, useState } from "react";
import { listActivities } from "@/lib/api";
import { Activity } from "@/lib/types";
import { fmtDate } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

export default function InboxPage() {
  const [rows, setRows] = useState<Activity[]>([]);
  const [type, setType] = useState("all");
  const { openDrawer } = useUIStore();

  useEffect(() => {
    listActivities().then((d) => setRows(d.rows));
  }, []);

  const filtered = rows.filter((r) => type === "all" || r.type === type);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Inbox</h1>
      <div className="flex gap-2 text-sm">
        {["all", "meeting", "email", "call", "note"].map((t) => <button key={t} className={`btn ${type === t ? "bg-muted" : ""}`} onClick={() => setType(t)}>{t}</button>)}
      </div>
      <div className="space-y-2">
        {filtered.map((a) => (
          <button key={a.id} className="w-full rounded-xl border p-3 text-left hover:bg-muted/40" onClick={() => openDrawer({ type: a.relatedType, id: a.relatedId })}>
            <p className="text-xs uppercase text-zinc-500">{a.type}</p>
            <p className="font-medium">{a.subject}</p>
            <p className="text-sm text-zinc-500">{a.summary}</p>
            <p className="text-xs text-zinc-400">{fmtDate(a.occurredAt)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
