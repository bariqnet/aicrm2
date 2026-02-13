"use client";

import { useEffect, useMemo, useState } from "react";
import { listCompanies, listDeals, listPeople } from "@/lib/api";
import { useUIStore } from "@/store/ui-store";

type Hit = { id: string; name: string; type: "person" | "company" | "deal" };

export function CommandPalette() {
  const { commandOpen, setCommandOpen, openDrawer } = useUIStore();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCommandOpen]);

  useEffect(() => {
    if (!commandOpen) return;
    Promise.all([listPeople({ q: query }), listCompanies({ q: query }), listDeals()]).then(([p, c, d]) => {
      const q = query.toLowerCase();
      setHits([
        ...p.rows.map((x) => ({ id: x.id, name: x.name, type: "person" as const })),
        ...c.rows.map((x) => ({ id: x.id, name: x.name, type: "company" as const })),
        ...d.rows.filter((x) => x.name.toLowerCase().includes(q || "")).map((x) => ({ id: x.id, name: x.name, type: "deal" as const }))
      ]);
    });
  }, [commandOpen, query]);

  const results = useMemo(() => hits.slice(0, 8), [hits]);
  if (!commandOpen) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-black/20 p-4 pt-24" onClick={() => setCommandOpen(false)}>
      <div className="w-full max-w-2xl rounded-xl border bg-bg p-3" onClick={(e) => e.stopPropagation()}>
        <input className="input mb-2 w-full" autoFocus placeholder="Search everything..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="space-y-1">
          {results.map((r) => (
            <button key={r.type + r.id} className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted"
              onClick={() => {
                openDrawer({ type: r.type, id: r.id });
                setCommandOpen(false);
              }}>
              <span>{r.name}</span><span className="text-xs uppercase text-zinc-500">{r.type}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
