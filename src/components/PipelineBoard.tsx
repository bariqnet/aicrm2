"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Expand, Minimize2 } from "lucide-react";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { FilterChips } from "@/components/FilterChips";
import { MetricCard, MetricGrid, PageHeader, SectionPanel } from "@/components/ui/workspace";
import { getDateLocale } from "@/lib/locale";
import { getResponseError, showErrorAlert } from "@/lib/sweet-alert";
import type { AppLanguage } from "@/lib/i18n";
import type { Company, Contact, Deal, Stage } from "@/lib/crm-types";
import { dealStatusMeta, formatCurrency, summarizeCurrencyTotals } from "@/lib/crm-presentation";

type PipelineBoardProps = {
  initialDeals: Deal[];
  stages: Stage[];
  companies: Company[];
  contacts: Contact[];
  language: AppLanguage;
};

function formatCloseDate(
  value: string | null | undefined,
  locale: string,
  tr: (english: string, arabic: string) => string,
): string {
  if (!value) return tr("No date", "بدون تاريخ");
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
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
    status: deal.status,
  };
}

export function PipelineBoard({
  initialDeals,
  stages,
  companies,
  contacts,
  language,
}: PipelineBoardProps) {
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);
  const locale = getDateLocale(language);
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null);
  const [activeDropStageId, setActiveDropStageId] = useState<string | null>(null);
  const [updatingDealIds, setUpdatingDealIds] = useState<string[]>([]);
  const [boardFullscreen, setBoardFullscreen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Deal["status"] | "all">("OPEN");
  const [searchValue, setSearchValue] = useState("");
  const deferredSearch = useDeferredValue(searchValue.trim().toLowerCase());

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
    [companies],
  );
  const contactsById = useMemo(
    () => new Map(contacts.map((contact) => [contact.id, contact] as const)),
    [contacts],
  );

  const visibleDeals = deals
    .filter((deal) => statusFilter === "all" || deal.status === statusFilter)
    .filter((deal) => {
      if (!deferredSearch) return true;
      return [
        deal.title,
        deal.description ?? "",
        deal.currency,
        companiesById.get(deal.companyId ?? "")?.name ?? "",
        contactsById.get(deal.primaryContactId ?? "")?.firstName ?? "",
        contactsById.get(deal.primaryContactId ?? "")?.lastName ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(deferredSearch);
    });

  const openVisibleDeals = visibleDeals.filter((deal) => deal.status === "OPEN");
  const lateStageDeals = openVisibleDeals
    .filter(
      (deal) =>
        stages.findIndex((stage) => stage.id === deal.stageId) >= Math.max(stages.length - 2, 0),
    )
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  const activeStageCount = new Set(visibleDeals.map((deal) => deal.stageId)).size;

  async function moveCardToStage(dealId: string, targetStageId: string) {
    const deal = deals.find((item) => item.id === dealId);
    if (!deal) return;
    if (deal.stageId === targetStageId) return;
    if (updatingDealIds.includes(dealId)) return;

    const previousStageId = deal.stageId;
    setDeals((previous) =>
      previous.map((item) => (item.id === dealId ? { ...item, stageId: targetStageId } : item)),
    );
    setUpdatingDealIds((previous) => [...previous, dealId]);

    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchPayloadFromDeal(deal, targetStageId)),
      });

      if (!response.ok) {
        throw new Error(
          await getResponseError(
            response,
            tr("Unable to move card. Please try again.", "تعذر نقل البطاقة. حاول مرة أخرى."),
          ),
        );
      }
    } catch (error) {
      setDeals((previous) =>
        previous.map((item) => (item.id === dealId ? { ...item, stageId: previousStageId } : item)),
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
        <EmptyState
          title={tr("No stages configured yet", "لا توجد مراحل مهيأة بعد")}
          hint={tr(
            "Configure stages in settings before using the pipeline board.",
            "قم بتهيئة المراحل من الإعدادات قبل استخدام لوحة خط المبيعات.",
          )}
          action={
            <Link href="/settings" className="btn">
              {tr("Configure stages", "تهيئة المراحل")}
            </Link>
          }
        />
      );
    }

    const renderColumn = (stage: Stage) => {
      const stageDeals = visibleDeals
        .filter((deal) => deal.stageId === stage.id)
        .sort((a, b) => b.amount - a.amount);
      const isDropTarget = activeDropStageId === stage.id;

      return (
        <section
          key={stage.id}
          className={[
            fitAllColumns ? "min-w-0 flex h-full flex-col" : "w-[320px] shrink-0",
            "rounded-[24px] border border-border/90 bg-surface2/68 transition",
            isDropTarget ? "ring-2 ring-accent/35" : "",
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
          <header className="border-b border-border/85 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold tracking-[-0.02em] text-fg">{stage.name}</h2>
                <p className="mt-1 text-xs text-mutedfg">
                  {summarizeCurrencyTotals(
                    stageDeals,
                    locale,
                    tr("No value", "بدون قيمة"),
                    (count) => tr(`${count} currencies`, `${count} عملات`),
                  )}
                </p>
              </div>
              <Badge tone={stageDeals.length > 0 ? "info" : "neutral"}>{stageDeals.length}</Badge>
            </div>
            <Link
              href={`/deals/new?stageId=${encodeURIComponent(stage.id)}`}
              className="btn mt-4 h-9 w-full"
            >
              {tr("Add opportunity", "إضافة فرصة")}
            </Link>
          </header>

          <div
            className={
              fitAllColumns
                ? "min-h-0 flex-1 space-y-2 overflow-y-auto p-3"
                : "max-h-[calc(100vh-370px)] space-y-2 overflow-y-auto p-3"
            }
          >
            {stageDeals.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-mutedfg">
                {tr("Drop opportunities here.", "أسقط الفرص هنا.")}
              </p>
            ) : (
              stageDeals.map((deal) => {
                const companyName = deal.companyId
                  ? (companiesById.get(deal.companyId)?.name ?? tr("Unknown", "غير معروف"))
                  : tr("No company", "بدون شركة");
                const contact = deal.primaryContactId
                  ? contactsById.get(deal.primaryContactId)
                  : null;
                const status = dealStatusMeta(deal.status, tr);
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
                      "group block rounded-[22px] border border-border/90 bg-surface px-4 py-4 text-sm transition hover:border-fg/12 hover:bg-surface2 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)] dark:hover:border-white/12 dark:hover:bg-white/[0.04]",
                      isUpdating ? "cursor-wait opacity-70" : "cursor-grab active:cursor-grabbing",
                    ].join(" ")}
                    onClick={(event) => {
                      if (draggingDealId === deal.id) event.preventDefault();
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium leading-5 text-fg">{deal.title}</p>
                        <p className="mt-1 truncate text-xs text-mutedfg">
                          {companyName}
                          {contact ? ` · ${contact.firstName} ${contact.lastName}` : ""}
                        </p>
                      </div>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </div>

                    <p className="mt-4 text-lg font-semibold tracking-[-0.03em] text-fg">
                      {formatCurrency(deal.amount, deal.currency, locale)}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-mutedfg">
                      <span>{tr("Expected close", "الإغلاق المتوقع")}</span>
                      <span>{formatCloseDate(deal.expectedCloseDate, locale, tr)}</span>
                    </div>
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
        <div className={fullHeight ? "min-h-0 flex-1" : "h-[calc(100vh-320px)]"}>
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
      <PageHeader
        eyebrow={tr("Pipeline workspace", "مساحة خط المبيعات")}
        title={tr("Pipeline", "خط المبيعات")}
        description={tr(
          "Use the board for stage movement, but keep scanning anchored in value, search, and status filters.",
          "استخدم اللوحة لتحريك المراحل مع إبقاء الفحص مرتكزًا على القيمة والبحث ومرشحات الحالة.",
        )}
        actions={
          <>
            <button className="btn" type="button" onClick={() => setBoardFullscreen(true)}>
              <Expand size={14} />
              {tr("Full screen", "ملء الشاشة")}
            </button>
            <Link href="/settings" className="btn">
              {tr("Manage stages", "إدارة المراحل")}
            </Link>
            <Link href="/deals/new" className="btn btn-primary">
              {tr("New opportunity", "فرصة جديدة")}
            </Link>
          </>
        }
      />

      <MetricGrid>
        <MetricCard
          label={tr("Visible cards", "البطاقات الظاهرة")}
          value={visibleDeals.length}
          hint={tr("Filtered opportunity count", "عدد الفرص بعد التصفية")}
        />
        <MetricCard
          label={tr("Open value", "القيمة المفتوحة")}
          value={summarizeCurrencyTotals(
            openVisibleDeals,
            locale,
            tr("No value", "بدون قيمة"),
            (count) => tr(`${count} currencies`, `${count} عملات`),
          )}
          hint={tr("Current visible pipeline", "خط المبيعات المرئي حاليًا")}
          tone="accent"
        />
        <MetricCard
          label={tr("Active stages", "المراحل النشطة")}
          value={activeStageCount}
          hint={tr("Stages containing visible cards", "المراحل التي تحتوي على بطاقات مرئية")}
        />
        <MetricCard
          label={tr("Late-stage focus", "التركيز المتأخر")}
          value={lateStageDeals.length}
          hint={tr("Late-stage open opportunities", "الفرص المفتوحة في المراحل المتأخرة")}
        />
      </MetricGrid>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <SectionPanel
          title={tr("Pipeline board", "لوحة خط المبيعات")}
          description={tr(
            "Search and status filters make the board usable even as volume grows.",
            "يجعل البحث ومرشحات الحالة اللوحة قابلة للاستخدام حتى مع زيادة الحجم.",
          )}
        >
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <FilterChips
              chips={[
                {
                  key: "open",
                  label: tr("Open", "مفتوحة"),
                  active: statusFilter === "OPEN",
                  onClick: () => setStatusFilter("OPEN"),
                  count: deals.filter((deal) => deal.status === "OPEN").length,
                },
                {
                  key: "all",
                  label: tr("All", "الكل"),
                  active: statusFilter === "all",
                  onClick: () => setStatusFilter("all"),
                  count: deals.length,
                },
                {
                  key: "won",
                  label: tr("Won", "رابحة"),
                  active: statusFilter === "WON",
                  onClick: () => setStatusFilter("WON"),
                  count: deals.filter((deal) => deal.status === "WON").length,
                },
                {
                  key: "lost",
                  label: tr("Lost", "خاسرة"),
                  active: statusFilter === "LOST",
                  onClick: () => setStatusFilter("LOST"),
                  count: deals.filter((deal) => deal.status === "LOST").length,
                },
              ]}
            />
            <input
              className="input w-full lg:max-w-sm"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={tr(
                "Search opportunities, companies, or contacts",
                "ابحث عن فرص أو شركات أو جهات اتصال",
              )}
            />
          </div>

          {visibleDeals.length === 0 ? (
            <EmptyState
              title={tr("No opportunities match this view", "لا توجد فرص تطابق هذا العرض")}
              hint={tr(
                "Try broadening the filters or create a new opportunity directly in the pipeline.",
                "جرّب توسيع المرشحات أو أنشئ فرصة جديدة مباشرة داخل خط المبيعات.",
              )}
              action={
                <Link href="/deals/new" className="btn btn-primary">
                  {tr("Create opportunity", "إنشاء فرصة")}
                </Link>
              }
            />
          ) : (
            renderBoard(false)
          )}
        </SectionPanel>

        <SectionPanel
          title={tr("Late-stage queue", "قائمة المراحل المتأخرة")}
          description={tr(
            "These visible deals deserve the clearest next step and owner confidence.",
            "هذه الصفقات المرئية تستحق أوضح خطوة تالية وثقة بالمسؤول.",
          )}
        >
          {lateStageDeals.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-surface2/70 px-4 py-4 text-sm text-mutedfg">
              {tr("No late-stage opportunities in this view.", "لا توجد فرص متأخرة في هذا العرض.")}
            </p>
          ) : (
            <div className="space-y-2">
              {lateStageDeals.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/deals/${deal.id}`}
                  className="block rounded-2xl border border-border/85 bg-surface2/70 px-4 py-3 transition hover:border-fg/12 hover:bg-surface"
                >
                  <p className="text-sm font-medium text-fg">{deal.title}</p>
                  <p className="mt-1 text-xs text-mutedfg">
                    {formatCurrency(deal.amount, deal.currency, locale)} ·{" "}
                    {formatCloseDate(deal.expectedCloseDate, locale, tr)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </SectionPanel>
      </section>

      {boardFullscreen ? (
        <div className="fixed inset-0 z-[80] bg-bg p-3 sm:p-4">
          <div className="mx-auto flex h-full w-full max-w-[2200px] flex-col">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-fg">
                {tr("Pipeline full screen view", "عرض خط المبيعات بملء الشاشة")}
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
