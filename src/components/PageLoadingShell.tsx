type PageLoadingShellProps = {
  title: string;
};

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`skeleton-shimmer ${className}`} aria-hidden />;
}

export function PageLoadingShell({ title }: PageLoadingShellProps) {
  return (
    <main className="app-page" aria-busy="true" aria-live="polite">
      <header className="space-y-5">
        <div className="space-y-3">
          <SkeletonBlock className="h-3 w-32 rounded-full" />
          <SkeletonBlock className="h-10 w-80 max-w-[80vw] rounded-2xl" />
          <SkeletonBlock className="h-5 w-[36rem] max-w-[88vw] rounded-2xl" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock className="h-10 w-32 rounded-xl" />
          <SkeletonBlock className="h-10 w-40 rounded-xl" />
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <article key={index} className="metric-card space-y-3 p-5">
            <SkeletonBlock className="h-3 w-20 rounded" />
            <SkeletonBlock className="h-9 w-20 rounded-xl" />
            <SkeletonBlock className="h-4 w-32 rounded-xl" />
          </article>
        ))}
      </section>

      <section className="table-shell p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <SkeletonBlock className="h-4 w-40 rounded-md" />
          <SkeletonBlock className="h-10 w-56 rounded-xl" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface2/70 px-4 py-4"
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
