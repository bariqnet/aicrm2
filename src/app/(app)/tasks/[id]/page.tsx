import Link from "next/link";
import { notFound } from "next/navigation";
import type { Activity, Note, Task } from "@/lib/crm-types";
import { serverApiRequest, serverApiRequestOrNull, type ServerListResponse } from "@/lib/server-crm";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await serverApiRequestOrNull<Task>(`/tasks/${id}`);
  if (!task) notFound();

  const [notesPayload, activityPayload] = await Promise.all([
    serverApiRequest<ServerListResponse<Note>>("/notes", {
      query: { relatedType: "task", relatedId: id }
    }),
    serverApiRequest<ServerListResponse<Activity>>("/activities", {
      query: { entityType: "task", entityId: id }
    })
  ]);

  const notes = notesPayload.rows ?? [];
  const activity = activityPayload.rows ?? [];

  return (
    <main className="app-page">
      <header className="space-y-2">
        <Link href="/tasks" className="text-sm text-mutedfg hover:text-fg">← Back to tasks</Link>
        <h1 className="page-title">Task detail</h1>
        <p className="page-subtitle">Context and updates related to this task item.</p>
      </header>

      <section className="panel p-4">
        <p className="text-lg font-semibold">{task.title}</p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <p>Status: <span className="text-mutedfg">{task.status}</span></p>
          <p>Due: <span className="text-mutedfg">{task.dueAt ?? "-"}</span></p>
          <p>Related type: <span className="text-mutedfg">{task.relatedType}</span></p>
          <p>Related ID: <span className="font-mono text-xs text-mutedfg">{task.relatedId}</span></p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">Notes</h2>
          <p className="mt-2 text-sm text-mutedfg">{notes.length} notes</p>
        </article>
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">Activity</h2>
          <p className="mt-2 text-sm text-mutedfg">{activity.length} events</p>
        </article>
      </section>
    </main>
  );
}
