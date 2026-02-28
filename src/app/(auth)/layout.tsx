export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg px-4 py-6 md:px-8">
      <div className="mx-auto grid min-h-screen w-full max-w-5xl gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <section className="hidden rounded-xl border border-border bg-surface p-8 md:block">
          <p className="text-xs uppercase tracking-[0.12em] text-mutedfg">AI CRM</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Run your pipeline with calm, clear workflows.</h1>
          <p className="mt-3 text-sm text-mutedfg">
            A Notion/Vercel-style workspace for contacts, deals, tasks, and reporting with consistent operations.
          </p>
        </section>

        <div className="mx-auto flex w-full max-w-md items-center">{children}</div>
      </div>
    </div>
  );
}
