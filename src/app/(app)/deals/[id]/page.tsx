import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getDealRecord,
  listActivitiesByEntity,
  listNotesByRelation,
  listStages,
  listTasksByRelation
} from "@/lib/mock-db";
import { getRequestContext } from "@/lib/request-context";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getRequestContext();
  const deal = getDealRecord(ctx, id);
  if (!deal) notFound();

  const notes = listNotesByRelation(ctx, "deal", id);
  const tasks = listTasksByRelation(ctx, "deal", id);
  const activity = listActivitiesByEntity(ctx, "deal", id);
  const stageName = listStages(ctx).find((stage) => stage.id === deal.stageId)?.name ?? deal.stageId;

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
