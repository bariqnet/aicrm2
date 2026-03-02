import Link from "next/link";
import { notFound } from "next/navigation";
import type { Activity, Deal, Note, Stage, Task } from "@/lib/crm-types";
import { serverApiRequest, serverApiRequestOrNull, type ServerListResponse } from "@/lib/server-crm";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await serverApiRequestOrNull<Deal>(`/deals/${id}`);
  if (!deal) notFound();

  const [notesPayload, tasksPayload, activityPayload, stagesPayload] = await Promise.all([
    serverApiRequest<ServerListResponse<Note>>("/notes", {
      query: { relatedType: "deal", relatedId: id }
    }),
    serverApiRequest<ServerListResponse<Task>>("/tasks", {
      query: { relatedType: "deal", relatedId: id }
    }),
    serverApiRequest<ServerListResponse<Activity>>("/activities", {
      query: { entityType: "deal", entityId: id }
    }),
    serverApiRequest<ServerListResponse<Stage>>("/stages")
  ]);

  const notes = notesPayload.rows ?? [];
  const tasks = tasksPayload.rows ?? [];
  const activity = activityPayload.rows ?? [];
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
          <Link href={`/deals/${id}/edit`} className="btn">Edit deal</Link>
        </div>
      </header>

      <section className="panel p-4">
        <p className="text-lg font-semibold">{deal.title}</p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <p>Amount: <span className="text-mutedfg">{deal.currency} {deal.amount.toLocaleString("en-US")}</span></p>
          <p>Status: <span className="text-mutedfg">{deal.status}</span></p>
          <p>Stage: <span className="text-mutedfg">{stageName}</span></p>
          <p>Expected close: <span className="text-mutedfg">{deal.expectedCloseDate ?? "-"}</span></p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">Activity</h2>
          <p className="mt-2 text-sm text-mutedfg">{activity.length} events</p>
        </article>
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">Notes</h2>
          <p className="mt-2 text-sm text-mutedfg">{notes.length} notes</p>
        </article>
        <article className="panel p-4 md:col-span-2">
          <h2 className="text-sm font-semibold">Tasks</h2>
          {tasks.length === 0 ? (
            <p className="mt-2 text-sm text-mutedfg">No related tasks.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {tasks.map((task) => (
                <li key={task.id} className="rounded-md border border-border bg-surface2 px-3 py-2 text-sm">
                  <Link href={`/tasks/${task.id}`} className="hover:underline">
                    {task.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
