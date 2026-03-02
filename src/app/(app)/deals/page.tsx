import Link from "next/link";
import type { Deal, Stage } from "@/lib/crm-types";
import { serverApiRequest, type ServerListResponse } from "@/lib/server-crm";

export default async function DealsPage() {
  const [dealsPayload, stagesPayload] = await Promise.all([
    serverApiRequest<ServerListResponse<Deal>>("/deals"),
    serverApiRequest<ServerListResponse<Stage>>("/stages")
  ]);
  const deals = dealsPayload.rows ?? [];
  const stages = stagesPayload.rows ?? [];

  return (
    <main className="app-page">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Deals</h1>
          <p className="page-subtitle">A kanban view of pipeline stages and momentum.</p>
        </div>
        <Link href="/deals/new" className="btn btn-primary">New deal</Link>
      </header>

      {stages.length === 0 ? (
        <p className="panel panel-dashed p-8 text-sm text-mutedfg">No stages configured yet. Add stages in Settings.</p>
      ) : (
        <div className="grid gap-3 xl:grid-cols-4">
          {stages.map((stage) => {
            const stageDeals = deals.filter((deal) => deal.stageId === stage.id);

            return (
              <section key={stage.id} className="panel-soft p-3">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-mutedfg">{stage.name}</h2>
                <div className="space-y-2">
                  {stageDeals.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-mutedfg">
                      No deals in this stage.
                    </p>
                  ) : (
                    stageDeals.map((deal) => (
                      <Link
                        href={`/deals/${deal.id}`}
                        key={deal.id}
                        className="block rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-muted/40"
                      >
                        <p className="font-medium">{deal.title}</p>
                        <p className="mt-1 text-mutedfg">{deal.currency} {deal.amount.toLocaleString("en-US")}</p>
                      </Link>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
