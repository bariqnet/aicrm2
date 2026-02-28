export function FilterChips({ chips }: { chips: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button key={chip} className="btn h-8 rounded-md px-3 text-xs">
          {chip}
        </button>
      ))}
    </div>
  );
}
