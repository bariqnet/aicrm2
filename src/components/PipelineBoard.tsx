"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Expand, Minimize2 } from "lucide-react";
import { getResponseError, showErrorAlert } from "@/lib/sweet-alert";
import type { AppLanguage } from "@/lib/i18n";
import type { Company, Contact, Deal, Stage } from "@/lib/crm-types";

type PipelineBoardProps = {
  initialDeals: Deal[];
  stages: Stage[];
  companies: Company[];
  contacts: Contact[];
  language: AppLanguage;
};

function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString(locale)}`;
  }
}

function formatCloseDate(
  value: string | null | undefined,
  locale: string,
  tr: (english: string, arabic: string) => string
): string {
  if (!value) return tr("No date", "بدون تاريخ");
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
}

function statusLabel(status: Deal["status"], tr: (english: string, arabic: string) => string): string {
  if (status === "WON") return tr("Won", "رابحة");
  if (status === "LOST") return tr("Lost", "خاسرة");
  return tr("Open", "مفتوحة");
}

function statusBadgeClasses(status: Deal["status"]): string {
  if (status === "WON") return "border-emerald-300/70 bg-emerald-50 text-emerald-700";
  if (status === "LOST") return "border-rose-300/70 bg-rose-50 text-rose-700";
  return "border-sky-300/70 bg-sky-50 text-sky-700";
}

function patchPayloadFromDeal(deal: Deal, targetStageId: string) {
  return {
    title: deal.title,
    amount: deal.amount,
    currency: deal.currency,
    stageId: targetStageId,
    companyId: deal.companyId ?? undefined,
    primaryContactId: deal.primaryContactId ?? undefined,
    expectedCloseDate: deal.expectedCloseDate ?? undefined,
    status: deal.status
  };
}

export function PipelineBoard({
  initialDeals,
  stages,
  companies,
  contacts,
  language
}: PipelineBoardProps) {
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);
  const locale = language === "ar" ? "ar-IQ" : "en-US";
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null);
  const [activeDropStageId, setActiveDropStageId] = useState<string | null>(null);
  const [updatingDealIds, setUpdatingDealIds] = useState<string[]>([]);
  const [boardFullscreen, setBoardFullscreen] = useState(false);

  useEffect(() => {
    setDeals(initialDeals);
  }, [initialDeals]);

  useEffect(() => {
    if (!boardFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [boardFullscreen]);

  const companiesById = useMemo(
    () => new Map(companies.map((company) => [company.id, company] as const)),
    [companies]
  );
  const contactsById = useMemo(
    () => new Map(contacts.map((contact) => [contact.id, contact] as const)),
    [contacts]
  );

  const openCards = deals.filter((deal) => deal.status === "OPEN");
  const totalValue = deals.reduce((sum, deal) => sum + deal.amount, 0);

  async function moveCardToStage(dealId: string, targetStageId: string) {
    const deal = deals.find((item) => item.id === dealId);
    if (!deal) return;
    if (deal.stageId === targetStageId) return;
    if (updatingDealIds.includes(dealId)) return;

    const previousStageId = deal.stageId;
    setDeals((previous) =>
      previous.map((item) => (item.id === dealId ? { ...item, stageId: targetStageId } : item))
    );
    setUpdatingDealIds((previous) => [...previous, dealId]);

    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchPayloadFromDeal(deal, targetStageId))
      });

      if (!response.ok) {
        throw new Error(
          await getResponseError(
            response,
            tr("Unable to move card. Please try again.", "تعذر نقل البطاقة. حاول مرة أخرى.")
          )
        );
      }
    } catch (error) {
      setDeals((previous) =>
        previous.map((item) => (item.id === dealId ? { ...item, stageId: previousStageId } : item))
      );
      const message =
        error instanceof Error
          ? error.message
          : tr("Unable to move card. Please try again.", "تعذر نقل البطاقة. حاول مرة أخرى.");
      await showErrorAlert(tr("Card move failed", "فشل نقل البطاقة"), message);
    } finally {
      setUpdatingDealIds((previous) => previous.filter((id) => id !== dealId));
      setDraggingDealId(null);
      setActiveDropStageId(null);
    }
  }

  function readDraggedDealId(dataTransfer: DataTransfer): string | null {
    if (draggingDealId) return draggingDealId;
    const fromData = dataTransfer.getData("text/plain");
    return fromData || null;
  }

  function renderBoard(fitAllColumns: boolean, fullHeight = false) {
    if (stages.length === 0) {
      return (
        <div className="panel panel-dashed p-8 text-sm text-mutedfg">
          <p>{tr("No stages configured yet.", "لا توجد مراحل مهيأة بعد.")}</p>
          <Link href="/settings" className="mt-3 inline-flex text-sm font-medium text-accent hover:underline">
            {tr("Configure stages in settings", "قم بتهيئة المراحل من الإعدادات")}
          </Link>
        </div>
      );
    }

    const renderColumn = (stage: Stage) => {
      const stageDeals = deals
        .filter((deal) => deal.stageId === stage.id)
        .sort((a, b) => b.amount - a.amount);
      const stageOpenCount = stageDeals.filter((deal) => deal.status === "OPEN").length;
      const isDropTarget = activeDropStageId === stage.id;

      return (
        <section
          key={stage.id}
          className={[
            fitAllColumns ? "min-w-0 flex h-full flex-col" : "w-[320px] shrink-0",
            "rounded-xl border border-border bg-surface shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition",
            isDropTarget ? "ring-2 ring-accent/35" : ""
          ].join(" ")}
          onDragOver={(event) => {
            event.preventDefault();
            if (activeDropStageId !== stage.id) setActiveDropStageId(stage.id);
          }}
          onDrop={async (event) => {
            event.preventDefault();
            const dealId = readDraggedDealId(event.dataTransfer);
            if (!dealId) return;
            await moveCardToStage(dealId, stage.id);
          }}
        >
          <header className="border-b border-border px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="truncate text-sm font-semibold" title={stage.name}>
                {stage.name}
              </h2>
              <span className="rounded-full border border-border bg-surface2 px-2 py-0.5 text-xs text-mutedfg">
                {stageDeals.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-mutedfg">
              {tr("Open", "مفتوحة")}: {stageOpenCount}
            </p>
            <Link href={`/deals/new?stageId=${encodeURIComponent(stage.id)}`} className="btn mt-3 h-8 w-full text-xs">
              {tr("Add card", "إضافة بطاقة")}
            </Link>
          </header>

          <div
            className={
              fitAllColumns
                ? "min-h-0 flex-1 space-y-2 overflow-y-auto p-2"
                : "max-h-[calc(100vh-320px)] space-y-2 overflow-y-auto p-2"
            }
          >
            {stageDeals.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-surface2 px-3 py-6 text-center text-xs text-mutedfg">
                {tr("Drop cards here.", "أسقط البطاقات هنا.")}
              </p>
            ) : (
              stageDeals.map((deal) => {
                const companyName = deal.companyId
                  ? (companiesById.get(deal.companyId)?.name ?? tr("Unknown", "غير معروف"))
                  : "-";
                const contact = deal.primaryContactId ? contactsById.get(deal.primaryContactId) : null;
                const contactName = contact
                  ? `${contact.firstName} ${contact.lastName}`
                  : deal.primaryContactId
                    ? tr("Unknown", "غير معروف")
                    : "-";
                const isUpdating = updatingDealIds.includes(deal.id);

                return (
                  <Link
                    href={`/deals/${deal.id}`}
                    key={deal.id}
                    draggable={!isUpdating}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", deal.id);
                      setDraggingDealId(deal.id);
                    }}
                    onDragEnd={() => {
                      setDraggingDealId(null);
                      setActiveDropStageId(null);
                    }}
                    className={[
                      "group block rounded-xl border border-border bg-surface2 px-3 py-3 text-sm transition hover:-translate-y-0.5 hover:border-fg/20 hover:bg-surface hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]",
                      isUpdating ? "cursor-wait opacity-70" : "cursor-grab active:cursor-grabbing"
                    ].join(" ")}
                    onClick={(event) => {
                      if (draggingDealId === deal.id) event.preventDefault();
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium leading-5 text-fg">{deal.title}</p>
                      <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusBadgeClasses(deal.status)}`}>
                        {statusLabel(deal.status, tr)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-fg">
                      {formatMoney(deal.amount, deal.currency, locale)}
                    </p>

                    <div className="mt-2 space-y-1 text-xs text-mutedfg">
                      <p>{tr("Company", "الشركة")}: {companyName}</p>
                      <p>{tr("Contact", "جهة الاتصال")}: {contactName}</p>
                    </div>

                    <p className="mt-2 text-[11px] text-mutedfg">
                      {tr("Expected close", "الإغلاق المتوقع")}: {formatCloseDate(deal.expectedCloseDate, locale, tr)}
                    </p>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      );
    };

    if (fitAllColumns) {
      return (
        <div className={fullHeight ? "min-h-0 flex-1" : "h-[calc(100vh-240px)]"}>
          <div
            className="grid h-full gap-3"
            style={{ gridTemplateColumns: `repeat(${Math.max(stages.length, 1)}, minmax(0, 1fr))` }}
          >
            {stages.map((stage) => renderColumn(stage))}
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max items-start gap-4">
          {stages.map((stage) => renderColumn(stage))}
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">{tr("Pipeline", "البايبلاين")}</h1>
          <p className="page-subtitle">
            {tr(
              "Trello-style board. Drag cards between stages to update pipeline.",
              "لوحة بأسلوب Trello. اسحب البطاقات بين المراحل لتحديث البايبلاين."
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn" type="button" onClick={() => setBoardFullscreen(true)}>
            <Expand size={14} />
            {tr("Full screen", "ملء الشاشة")}
          </button>
          <Link href="/settings" className="btn">
            {tr("Manage stages", "إدارة المراحل")}
          </Link>
          <Link href="/deals/new" className="btn btn-primary">
            {tr("New pipeline card", "بطاقة بايبلاين جديدة")}
          </Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="panel p-4">
          <p className="muted-label">{tr("Total cards", "إجمالي البطاقات")}</p>
          <p className="mt-2 text-2xl font-semibold">{deals.length}</p>
        </article>
        <article className="panel p-4">
          <p className="muted-label">{tr("Open cards", "البطاقات المفتوحة")}</p>
          <p className="mt-2 text-2xl font-semibold">{openCards.length}</p>
        </article>
        <article className="panel p-4">
          <p className="muted-label">{tr("Pipeline value", "قيمة البايبلاين")}</p>
          <p className="mt-2 text-2xl font-semibold">{formatMoney(totalValue, "USD", locale)}</p>
        </article>
      </section>

      {renderBoard(false)}

      {boardFullscreen ? (
        <div className="fixed inset-0 z-[80] bg-bg p-3 sm:p-4">
          <div className="mx-auto flex h-full w-full max-w-[2200px] flex-col">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-fg">
                {tr("Pipeline full screen view", "عرض البايبلاين بملء الشاشة")}
              </h2>
              <button className="btn" type="button" onClick={() => setBoardFullscreen(false)}>
                <Minimize2 size={14} />
                {tr("Exit full screen", "إنهاء ملء الشاشة")}
              </button>
            </div>
            {renderBoard(true, true)}
          </div>
        </div>
      ) : null}
    </>
  );
}
