"use client";

import { useEffect, useState } from "react";
import { listActivities, listTasks } from "@/lib/api";
import { Activity, Task } from "@/lib/types";
import { Timeline } from "@/components/Timeline";
import { useUIStore } from "@/store/ui-store";

export function DetailDrawer() {
  const { drawer, openDrawer } = useUIStore();
  const [tab, setTab] = useState<"overview" | "timeline" | "tasks">("overview");
  const [timeline, setTimeline] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!drawer) return;
    listActivities().then((d) => setTimeline(d.rows.filter((a) => a.relatedType === drawer.type && a.relatedId === drawer.id)));
    listTasks().then((d) => setTasks(d.rows.filter((t) => t.relatedType === drawer.type && t.relatedId === drawer.id)));
  }, [drawer]);

  if (!drawer) return null;
  return (
    <aside className="fixed right-0 top-0 z-40 h-screen w-full max-w-md border-l bg-bg p-4 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold capitalize">{drawer.type} details</h2>
        <button className="btn" onClick={() => openDrawer(null)}>Close</button>
      </div>
      <div className="mb-3 flex gap-2 text-sm">
        {(["overview", "timeline", "tasks"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`btn ${tab === t ? "bg-muted" : ""}`}>{t}</button>
        ))}
      </div>
      {tab === "overview" && <p className="text-sm text-zinc-500">Core fields and notes for selected record.</p>}
      {tab === "timeline" && <Timeline activities={timeline} />}
      {tab === "tasks" && <div className="space-y-2">{tasks.map((t) => <div key={t.id} className="rounded border p-2 text-sm">{t.title}</div>)}</div>}
    </aside>
  );
}
