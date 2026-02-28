export default function ReportsPage() {
  return (
    <main className="app-page">
      <header>
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Decision-ready snapshots for pipeline and revenue.</p>
      </header>

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">Pipeline report</h2>
          <p className="mt-2 text-sm text-mutedfg">Stage conversion and weighted pipeline reporting placeholder.</p>
        </article>
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">Accounting report</h2>
          <p className="mt-2 text-sm text-mutedfg">Invoice aging and payment velocity reporting placeholder.</p>
        </article>
      </section>
    </main>
  );
}
