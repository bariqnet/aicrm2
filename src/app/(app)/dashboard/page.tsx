import Link from "next/link";
import { listActivities, listDeals, listTasks } from "@/lib/mock-db";
import { getRequestContext } from "@/lib/request-context";

export default async function DashboardPage() {
  const ctx = await getRequestContext();
  const deals = listDeals(ctx);
  const tasks = listTasks(ctx);
  const activities = listActivities(ctx);

  const openDeals = deals.filter((deal) => deal.status === "OPEN");
  const openTasks = tasks.filter((task) => task.status === "OPEN");
  const pipelineTotal = openDeals.reduce((sum, deal) => sum + deal.amount, 0);

  return (
    <main className="app-page">
      <header>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">A clear view of pipeline health, priorities, and daily progress.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="metric-card">
          <p className="muted-label">Open deals</p>
          <p className="mt-2 text-3xl font-semibold">{openDeals.length}</p>
        </article>
        <article className="metric-card">
          <p className="muted-label">Open tasks</p>
          <p className="mt-2 text-3xl font-semibold">{openTasks.length}</p>
        </article>
        <article className="metric-card">
          <p className="muted-label">Pipeline total</p>
          <p className="mt-2 text-3xl font-semibold">${pipelineTotal.toLocaleString("en-US")}</p>
        </article>
        <article className="metric-card">
          <p className="muted-label">Recent activity</p>
          <p className="mt-2 text-3xl font-semibold">{activities.length}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">Action queue</h2>
          <p className="mt-1 text-sm text-mutedfg">Focus on the highest-leverage work first.</p>
          <div className="mt-4 space-y-2 text-sm">
            <Link href="/deals" className="block rounded-md border border-border px-3 py-2 hover:bg-muted">
              Review deals in active stages
            </Link>
            <Link href="/tasks" className="block rounded-md border border-border px-3 py-2 hover:bg-muted">
              Clear overdue and today tasks
            </Link>
            <Link href="/contacts/new" className="block rounded-md border border-border px-3 py-2 hover:bg-muted">
              Add a new contact to pipeline
            </Link>
          </div>
        </article>

        <article className="panel p-4">
          <h2 className="text-sm font-semibold">System notes</h2>
          <p className="mt-2 text-sm text-mutedfg">
            Use this workspace as your daily operating system: capture context in contacts, keep deal stages current,
            and close each day with an updated task list.
          </p>
        </article>
      </section>
    </main>
  );
}
