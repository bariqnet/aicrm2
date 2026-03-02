import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { AddNoteForm } from "@/components/AddNoteForm";
import { TaskStatusControl } from "@/components/TaskStatusControl";
import type { Activity, Company, Contact, Deal, Note, Task } from "@/lib/crm-types";
import { serverApiRequest, serverApiRequestOrNull, type ServerListResponse } from "@/lib/server-crm";

function fmtDateTime(value?: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

type RelatedEntitySummary = {
  label: string;
  href: string;
};

async function loadRelatedEntity(task: Task): Promise<RelatedEntitySummary | null> {
  if (task.relatedType === "contact") {
    const contact = await serverApiRequestOrNull<Contact>(`/contacts/${task.relatedId}`);
    if (!contact) return null;
    return {
      label: `${contact.firstName} ${contact.lastName}`.trim(),
      href: `/contacts/${contact.id}`
    };
  }

  if (task.relatedType === "company") {
    const company = await serverApiRequestOrNull<Company>(`/companies/${task.relatedId}`);
    if (!company) return null;
    return { label: company.name, href: `/companies/${company.id}` };
  }

  if (task.relatedType === "deal") {
    const deal = await serverApiRequestOrNull<Deal>(`/deals/${task.relatedId}`);
    if (!deal) return null;
    return { label: deal.title, href: `/deals/${deal.id}` };
  }

  const relatedTask = await serverApiRequestOrNull<Task>(`/tasks/${task.relatedId}`);
  if (!relatedTask) return null;
  return { label: relatedTask.title, href: `/tasks/${relatedTask.id}` };
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await serverApiRequestOrNull<Task>(`/tasks/${id}`);
  if (!task) notFound();

  const [notesPayload, activityPayload, relatedEntity] = await Promise.all([
    serverApiRequest<ServerListResponse<Note>>("/notes", {
      query: { relatedType: "task", relatedId: id }
    }),
    serverApiRequest<ServerListResponse<Activity>>("/activities", {
      query: { entityType: "task", entityId: id }
    }),
    loadRelatedEntity(task)
  ]);

  const notes = (notesPayload.rows ?? [])
    .filter((note) => note.relatedType === "task" && note.relatedId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const activity = (activityPayload.rows ?? [])
    .filter((entry) => entry.entityType === "task" && entry.entityId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <main className="app-page">
      <header className="space-y-2">
        <Link href="/tasks" className="text-sm text-mutedfg hover:text-fg">← Back to tasks</Link>
        <h1 className="page-title">Task detail</h1>
        <p className="page-subtitle">Context and updates related to this task item.</p>
      </header>

      <section className="panel p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">{task.title}</p>
            <p className="mt-1 text-sm text-mutedfg">Status: {task.status}</p>
          </div>
          <TaskStatusControl taskId={task.id} status={task.status} />
        </div>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <p>Due: <span className="text-mutedfg">{fmtDateTime(task.dueAt)}</span></p>
          <p>Related type: <span className="text-mutedfg">{task.relatedType}</span></p>
          <p>
            Related record:{" "}
            {relatedEntity ? (
              <Link href={relatedEntity.href as Route} className="text-accent hover:underline">{relatedEntity.label}</Link>
            ) : (
              <span className="font-mono text-xs text-mutedfg">{task.relatedId}</span>
            )}
          </p>
          <p>Task ID: <span className="font-mono text-xs text-mutedfg">{task.id}</span></p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">Notes</h2>
          <div className="mt-3">
            <AddNoteForm relatedType="task" relatedId={id} />
          </div>
          {notes.length === 0 ? (
            <p className="mt-2 text-sm text-mutedfg">No notes yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {notes.map((note) => (
                <li key={note.id} className="rounded-md border border-border bg-surface2 px-3 py-2 text-sm">
                  <p>{note.body}</p>
                  <p className="mt-1 text-xs text-mutedfg">{fmtDateTime(note.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel p-4">
          <h2 className="text-sm font-semibold">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="mt-2 text-sm text-mutedfg">No activity yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {activity.slice(0, 8).map((entry) => (
                <li key={entry.id} className="rounded-md border border-border bg-surface2 px-3 py-2 text-sm">
                  <p className="font-medium">{entry.type}</p>
                  <p className="text-xs text-mutedfg">{fmtDateTime(entry.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
