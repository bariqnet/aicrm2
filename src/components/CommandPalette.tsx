"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Eye } from "lucide-react";
import { Badge } from "@/components/Badge";
import { useI18n } from "@/hooks/useI18n";
import { listCompaniesApi, listContactsApi, listDealsApi, listTasksApi } from "@/lib/api";
import type { Task } from "@/lib/crm-types";
import { getDateLocale } from "@/lib/locale";
import { useUIStore } from "@/store/ui-store";

type Hit = {
  href: string;
  id: string;
  name: string;
  previewType: Task["relatedType"];
  subtitle?: string;
  type: "contact" | "company" | "deal" | "task";
};

export function CommandPalette() {
  const { commandOpen, setCommandOpen, openDrawer } = useUIStore();
  const { language, t } = useI18n();
  const locale = getDateLocale(language);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
      if (e.key === "Escape") {
        setCommandOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCommandOpen]);

  useEffect(() => {
    if (!commandOpen) return;
    let cancelled = false;
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    Promise.all([
      listContactsApi({ q: deferredQuery }),
      listCompaniesApi({ q: deferredQuery }),
      listDealsApi({ q: deferredQuery }),
      listTasksApi(),
    ])
      .then(([contacts, companies, deals, tasks]) => {
        if (cancelled) return;

        const taskHits = tasks.rows
          .filter((task) => {
            if (!normalizedQuery) return true;
            return [task.title, task.relatedType, task.relatedId]
              .join(" ")
              .toLowerCase()
              .includes(normalizedQuery);
          })
          .map((task) => ({
            href: `/tasks/${task.id}`,
            id: task.id,
            name: task.title,
            previewType: "task" as const,
            subtitle: `${t(`command.type.${task.relatedType}`)} · ${task.relatedId}`,
            type: "task" as const,
          }));

        setHits([
          ...contacts.rows.map((contact) => ({
            href: `/contacts/${contact.id}`,
            id: contact.id,
            name: `${contact.firstName} ${contact.lastName}`.trim(),
            previewType: "contact" as const,
            subtitle: contact.email ?? contact.phone ?? contact.id,
            type: "contact" as const,
          })),
          ...companies.rows.map((company) => ({
            href: `/companies/${company.id}`,
            id: company.id,
            name: company.name,
            previewType: "company" as const,
            subtitle: company.domain ?? company.industry ?? company.id,
            type: "company" as const,
          })),
          ...deals.rows.map((deal) => ({
            href: `/deals/${deal.id}`,
            id: deal.id,
            name: deal.title,
            previewType: "deal" as const,
            subtitle: `${deal.currency} ${deal.amount.toLocaleString(locale)}`,
            type: "deal" as const,
          })),
          ...taskHits,
        ]);
      })
      .catch(() => {
        if (!cancelled) setHits([]);
      });

    return () => {
      cancelled = true;
    };
  }, [commandOpen, deferredQuery, locale, t]);

  useEffect(() => {
    if (commandOpen) return;
    setQuery("");
    setHits([]);
  }, [commandOpen]);

  const results = useMemo(() => hits.slice(0, 10), [hits]);
  if (!commandOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-start bg-[rgba(15,23,42,0.18)] p-4 pt-16 backdrop-blur-sm dark:bg-black/60"
      onClick={() => setCommandOpen(false)}
    >
      <div
        className="w-full max-w-3xl rounded-[28px] border border-border bg-surface p-3 shadow-[0_24px_80px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-black/95 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          className="input mb-3 w-full"
          autoFocus
          placeholder={t("command.searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="max-h-[460px] space-y-1 overflow-y-auto">
          {results.map((r) => (
            <div
              key={r.type + r.id}
              className="flex items-center gap-2 rounded-2xl border border-transparent px-2 py-2 transition hover:border-fg/10 hover:bg-surface2 dark:hover:border-white/12 dark:hover:bg-white/[0.06]"
            >
              <button
                className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl px-3 py-2 text-left"
                onClick={() => {
                  router.push(r.href as Route);
                  setCommandOpen(false);
                }}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-fg">{r.name}</span>
                  {r.subtitle ? (
                    <span className="block truncate text-xs text-mutedfg">{r.subtitle}</span>
                  ) : null}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Badge tone="neutral">{t(`command.type.${r.type}`)}</Badge>
                  <ArrowUpRight size={14} className="text-mutedfg" />
                </span>
              </button>
              <button
                type="button"
                className="btn h-9 w-9 shrink-0 px-0"
                aria-label={t("command.preview")}
                title={t("command.preview")}
                onClick={() => {
                  openDrawer({ type: r.previewType, id: r.id });
                  setCommandOpen(false);
                }}
              >
                <Eye size={14} />
              </button>
            </div>
          ))}
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-mutedfg">{t("command.empty")}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
