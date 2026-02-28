export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="panel panel-dashed p-9 text-center text-sm text-mutedfg">
      <p className="font-medium text-fg">{title}</p>
      <p className="mt-1">{hint}</p>
    </div>
  );
}
