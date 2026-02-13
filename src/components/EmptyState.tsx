export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center text-sm text-zinc-500">
      <p className="font-medium text-zinc-700 dark:text-zinc-200">{title}</p>
      <p>{hint}</p>
    </div>
  );
}
