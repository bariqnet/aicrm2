export function FilterChips({ chips }: { chips: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button key={chip} className="rounded-full border px-2.5 py-1 text-xs hover:bg-muted">
          {chip}
        </button>
      ))}
    </div>
  );
}
