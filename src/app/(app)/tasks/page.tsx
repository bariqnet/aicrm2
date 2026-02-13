"use client";

import { useEffect, useMemo, useState } from "react";
import { listTasks, toggleTask } from "@/lib/api";
import { Task } from "@/lib/types";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const load = async () => setTasks((await listTasks()).rows);
  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const now = new Date();
    return {
      Today: tasks.filter((t) => new Date(t.dueAt).toDateString() === now.toDateString()),
      Upcoming: tasks.filter((t) => new Date(t.dueAt) > now),
      Overdue: tasks.filter((t) => new Date(t.dueAt) < now && t.status === "open")
    };
  }, [tasks]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Tasks</h1>
      {Object.entries(grouped).map(([group, rows]) => (
        <section key={group} className="rounded-xl border p-4">
          <h2 className="mb-2 text-sm font-medium text-zinc-500">{group}</h2>
          <div className="space-y-2">
            {rows.map((task) => (
              <label key={task.id} className="flex items-center gap-2 rounded border p-2 text-sm">
                <input type="checkbox" checked={task.status === "done"} onChange={async () => { await toggleTask(task.id); load(); }} />
                {task.title}
              </label>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
