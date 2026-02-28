import Link from "next/link";
import { listTasks } from "@/lib/mock-db";
import { getRequestContext } from "@/lib/request-context";

function groupKey(dueAt?: string | null): "Overdue" | "Today" | "Upcoming" {
  if (!dueAt) return "Upcoming";

  const due = new Date(dueAt);
  const now = new Date();
  const dueDate = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (dueDate.getTime() < nowDate.getTime()) return "Overdue";
  if (dueDate.getTime() === nowDate.getTime()) return "Today";
  return "Upcoming";
}

export default async function TasksPage() {
  const ctx = await getRequestContext();
  const tasks = listTasks(ctx);

  const grouped = {
    Overdue: tasks.filter((task) => task.status === "OPEN" && groupKey(task.dueAt) === "Overdue"),
    Today: tasks.filter((task) => groupKey(task.dueAt) === "Today"),
    Upcoming: tasks.filter((task) => groupKey(task.dueAt) === "Upcoming")
  };

  return (
    <main className="app-page">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Keep work focused by urgency and due date.</p>
        </div>
        <Link href="/tasks/new" className="btn btn-primary">New task</Link>
      </header>

      {Object.entries(grouped).map(([label, rows]) => (
        <section key={label} className="panel p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-mutedfg">{label}</h2>
          <div className="space-y-2">
            {rows.length === 0 ? (
              <p className="text-sm text-mutedfg">No tasks.</p>
            ) : (
              rows.map((task) => (
                <Link
                  href={`/tasks/${task.id}`}
                  key={task.id}
                  className="block rounded-md border border-border bg-surface2 px-3 py-2 text-sm hover:bg-muted/55"
                >
                  {task.title}
                </Link>
              ))
            )}
          </div>
        </section>
      ))}
    </main>
  );
}
