"use client";

import { useEffect, useMemo, useState } from "react";
import { listCompaniesApi, listContactsApi, listDealsApi } from "@/lib/api";
import { useUIStore } from "@/store/ui-store";

type Hit = { id: string; name: string; type: "contact" | "company" | "deal" };

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
    let cancelled = false;

    Promise.all([listContactsApi({ q: query }), listCompaniesApi({ q: query }), listDealsApi({ q: query })])
      .then(([contacts, companies, deals]) => {
        if (cancelled) return;
        setHits([
          ...contacts.rows.map((contact) => ({
            id: contact.id,
            name: `${contact.firstName} ${contact.lastName}`.trim(),
            type: "contact" as const
          })),
          ...companies.rows.map((company) => ({ id: company.id, name: company.name, type: "company" as const })),
          ...deals.rows.map((deal) => ({ id: deal.id, name: deal.title, type: "deal" as const }))
        ]);
      })
      .catch(() => {
        if (!cancelled) setHits([]);
      });

    return () => {
      cancelled = true;
    };
  }, [commandOpen, query]);

  const results = useMemo(() => hits.slice(0, 8), [hits]);
  if (!commandOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-start bg-black/20 p-4 pt-24 backdrop-blur-[1px]"
      onClick={() => setCommandOpen(false)}
    >
      <div className="panel w-full max-w-2xl p-3" onClick={(e) => e.stopPropagation()}>
        <input className="input mb-2 w-full" autoFocus placeholder="Search everything..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="space-y-1">
          {results.map((r) => (
            <button
              key={r.type + r.id}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition hover:bg-muted"
              onClick={() => {
                openDrawer({ type: r.type, id: r.id });
                setCommandOpen(false);
              }}
            >
              <span>{r.name}</span>
              <span className="text-xs uppercase text-mutedfg">{r.type}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
