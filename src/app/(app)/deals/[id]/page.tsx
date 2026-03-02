import Link from "next/link";
import { notFound } from "next/navigation";
import { AddNoteForm } from "@/components/AddNoteForm";
import type { Activity, Company, Contact, Deal, Note, Stage, Task } from "@/lib/crm-types";
import { serverApiRequest, serverApiRequestOrNull, type ServerListResponse } from "@/lib/server-crm";
import { fmtMoney } from "@/lib/utils";

function fmtDateTime(value?: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await serverApiRequestOrNull<Deal>(`/deals/${id}`);
  if (!deal) notFound();

  const [notesPayload, tasksPayload, activityPayload, stagesPayload, company, primaryContact] = await Promise.all([
    serverApiRequest<ServerListResponse<Note>>("/notes", {
      query: { relatedType: "deal", relatedId: id }
    }),
    serverApiRequest<ServerListResponse<Task>>("/tasks", {
      query: { relatedType: "deal", relatedId: id }
    }),
    serverApiRequest<ServerListResponse<Activity>>("/activities", {
      query: { entityType: "deal", entityId: id }
    }),
    serverApiRequest<ServerListResponse<Stage>>("/stages"),
    deal.companyId ? serverApiRequestOrNull<Company>(`/companies/${deal.companyId}`) : Promise.resolve(null),
    deal.primaryContactId
      ? serverApiRequestOrNull<Contact>(`/contacts/${deal.primaryContactId}`)
      : Promise.resolve(null)
  ]);

  const notes = (notesPayload.rows ?? [])
    .filter((note) => note.relatedType === "deal" && note.relatedId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const tasks = (tasksPayload.rows ?? []).filter((task) => task.relatedType === "deal" && task.relatedId === id);
  const activity = (activityPayload.rows ?? [])
    .filter((entry) => entry.entityType === "deal" && entry.entityId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const stageName = (stagesPayload.rows ?? []).find((stage) => stage.id === deal.stageId)?.name ?? deal.stageId;

  return (
    <main className="app-page">
      <header className="space-y-2">
        <Link href="/deals" className="text-sm text-mutedfg hover:text-fg">← Back to deals</Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="page-title">Deal profile</h1>
            <p className="page-subtitle">Opportunity context, next actions, and timeline activity.</p>
          </div>
          <Link href={`/deals/${id}/edit`} className="btn btn-primary">Edit deal</Link>
        </div>
      </header>

      <section className="panel p-4">
        <p className="text-lg font-semibold">{deal.title}</p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <p>Amount: <span className="text-mutedfg">{fmtMoney(deal.amount, deal.currency)}</span></p>
          <p>Status: <span className="text-mutedfg">{deal.status}</span></p>
          <p>Stage: <span className="text-mutedfg">{stageName}</span></p>
          <p>Expected close: <span className="text-mutedfg">{fmtDateTime(deal.expectedCloseDate)}</span></p>
          <p>
            Company:{" "}
            {company ? (
              <Link href={`/companies/${company.id}`} className="text-accent hover:underline">{company.name}</Link>
            ) : (
              <span className="text-mutedfg">-</span>
            )}
          </p>
          <p>
            Primary contact:{" "}
            {primaryContact ? (
              <Link href={`/contacts/${primaryContact.id}`} className="text-accent hover:underline">
                {primaryContact.firstName} {primaryContact.lastName}
              </Link>
            ) : (
              <span className="text-mutedfg">-</span>
            )}
          </p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">Tasks</h2>
          {tasks.length === 0 ? (
            <p className="mt-2 text-sm text-mutedfg">No related tasks.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {tasks.map((task) => (
                <li key={task.id} className="rounded-md border border-border bg-surface2 px-3 py-2 text-sm">
                  <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                    {task.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-mutedfg">{task.status} · Due {fmtDateTime(task.dueAt)}</p>
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

        <article className="panel p-4 md:col-span-2">
          <h2 className="text-sm font-semibold">Notes</h2>
          <div className="mt-3">
            <AddNoteForm relatedType="deal" relatedId={id} />
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
      </section>
    </main>
  );
}
