type PageLoadingShellProps = {
  title: string;
};

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`skeleton-shimmer ${className}`} aria-hidden />;
}

export function PageLoadingShell({ title }: PageLoadingShellProps) {
  return (
    <main className="app-page" aria-busy="true" aria-live="polite">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-48 rounded-lg" />
          <SkeletonBlock className="h-4 w-72 max-w-[80vw] rounded-md" />
        </div>
        <SkeletonBlock className="h-9 w-32 rounded-md" />
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <article key={index} className="metric-card space-y-3 p-4">
            <SkeletonBlock className="h-3 w-20 rounded" />
            <SkeletonBlock className="h-8 w-16 rounded-md" />
          </article>
        ))}
      </section>

      <section className="table-shell p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <SkeletonBlock className="h-4 w-40 rounded-md" />
          <SkeletonBlock className="h-4 w-20 rounded-md" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface2/70 px-3 py-3"
            >
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-52 max-w-[75vw] rounded-md" />
                <SkeletonBlock className="h-3 w-36 rounded-md" />
              </div>
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-7 w-16 rounded-full" />
                <SkeletonBlock className="h-7 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-mutedfg">{title}</p>
    </main>
  );
}
