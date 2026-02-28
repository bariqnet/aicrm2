import Link from "next/link";
import { listDeals, listStages } from "@/lib/mock-db";
import { getRequestContext } from "@/lib/request-context";

export default async function DealsPage() {
  const ctx = await getRequestContext();
  const deals = listDeals(ctx);
  const stages = listStages(ctx);

  return (
    <main className="app-page">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Deals</h1>
          <p className="page-subtitle">A kanban view of pipeline stages and momentum.</p>
        </div>
        <Link href="/deals/new" className="btn btn-primary">New deal</Link>
      </header>

      <div className="grid gap-3 xl:grid-cols-4">
        {stages.map((stage) => (
          <section key={stage.id} className="panel-soft p-3">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-mutedfg">{stage.name}</h2>
            <div className="space-y-2">
              {deals
                .filter((deal) => deal.stageId === stage.id)
                .map((deal) => (
                  <Link
                    href={`/deals/${deal.id}`}
                    key={deal.id}
                    className="block rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-muted/40"
                  >
                    <p className="font-medium">{deal.title}</p>
                    <p className="mt-1 text-mutedfg">{deal.currency} {deal.amount.toLocaleString("en-US")}</p>
                  </Link>
                ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
