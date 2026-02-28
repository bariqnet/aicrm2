import Link from "next/link";

export default function InvoicesPage() {
  return (
    <main className="app-page">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">Track billing status from draft to paid.</p>
        </div>
        <Link href="/invoices/new" className="btn btn-primary">New invoice</Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="metric-card">
          <p className="muted-label">Draft</p>
          <p className="mt-2 text-3xl font-semibold">0</p>
        </article>
        <article className="metric-card">
          <p className="muted-label">Sent</p>
          <p className="mt-2 text-3xl font-semibold">0</p>
        </article>
        <article className="metric-card">
          <p className="muted-label">Paid</p>
          <p className="mt-2 text-3xl font-semibold">0</p>
        </article>
        <article className="metric-card">
          <p className="muted-label">Overdue</p>
          <p className="mt-2 text-3xl font-semibold">0</p>
        </article>
      </section>

      <p className="panel panel-dashed p-8 text-sm text-mutedfg">No invoices created yet.</p>
    </main>
  );
}
