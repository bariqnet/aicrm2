"use client";

import type { Route } from "next";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { ArrowRight, Radar, Sparkles } from "lucide-react";
import { Badge } from "@/components/Badge";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { FilterChips } from "@/components/FilterChips";
import { PageHeader, SectionPanel } from "@/components/ui/workspace";
import type { AppLanguage } from "@/lib/i18n";
import type { Activity, Deal, Stage, Task } from "@/lib/crm-types";
import { getDateLocale } from "@/lib/locale";
import {
  dealStatusMeta,
  formatCompactNumber,
  formatCurrency,
  formatDateLabel,
  formatRelativeDateLabel,
  getTaskBucket,
  sortTasksByPriority,
  taskStatusMeta,
} from "@/lib/crm-presentation";

type DashboardWorkspaceProps = {
  activities: Activity[];
  companiesTotal: number;
  contactsTotal: number;
  deals: Deal[];
  language: AppLanguage;
  stages: Stage[];
  tasks: Task[];
};

type FocusView = "pipeline" | "tasks" | "activity";
type TaskFilter = "all" | "overdue" | "today" | "upcoming" | "done";

function percentage(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function summarizeActivityMetadata(metadata?: Record<string, unknown>): string | null {
  if (!metadata) return null;

  const entries = Object.entries(metadata)
    .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))
    .slice(0, 2);

  if (entries.length === 0) return null;
  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(" • ");
}

function getActivityHref(activity: Activity) {
  const entityType = activity.entityType.toLowerCase();
  if (entityType.includes("deal")) return `/deals/${activity.entityId}`;
  if (entityType.includes("task")) return `/tasks/${activity.entityId}`;
  if (entityType.includes("contact")) return `/contacts/${activity.entityId}`;
  if (entityType.includes("company")) return `/companies/${activity.entityId}`;
  return "/dashboard";
}

function relatedLabel(task: Task, tr: (english: string, arabic: string) => string) {
  if (task.relatedType === "contact") return tr("Contact", "جهة اتصال");
  if (task.relatedType === "company") return tr("Company", "شركة");
  if (task.relatedType === "deal") return tr("Deal", "صفقة");
  return tr("Task", "مهمة");
}

export function DashboardWorkspace({
  activities,
  companiesTotal,
  contactsTotal,
  deals,
  language,
  stages,
  tasks,
}: DashboardWorkspaceProps) {
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);
  const locale = getDateLocale(language);

  const [focusView, setFocusView] = useState<FocusView>("pipeline");
  const [dealFilter, setDealFilter] = useState<Deal["status"] | "all">("OPEN");
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [searchValue, setSearchValue] = useState("");
  const deferredSearch = useDeferredValue(searchValue.trim().toLowerCase());

  const orderedStages = [...stages].sort((a, b) => a.order - b.order);
  const stageNameById = Object.fromEntries(orderedStages.map((stage) => [stage.id, stage.name]));
  const openDeals = deals.filter((deal) => deal.status === "OPEN");
  const wonDeals = deals.filter((deal) => deal.status === "WON");
  const lostDeals = deals.filter((deal) => deal.status === "LOST");
  const openTasks = tasks.filter((task) => task.status === "OPEN");
  const doneTasks = tasks.filter((task) => task.status === "DONE");
  const overdueTasks = openTasks.filter((task) => getTaskBucket(task) === "overdue");
  const todayTasks = openTasks.filter((task) => getTaskBucket(task) === "today");
  const upcomingTasks = openTasks.filter((task) => getTaskBucket(task) === "upcoming");
  const recentActivities = [...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const stageSummaries = orderedStages.map((stage) => {
    const stageDeals = openDeals.filter((deal) => deal.stageId === stage.id);
    return {
      count: stageDeals.length,
      id: stage.id,
      name: stage.name,
      share: percentage(stageDeals.length, openDeals.length),
    };
  });
  const maxStageCount = Math.max(...stageSummaries.map((stage) => stage.count), 1);
  const dealsClosingSoon = openDeals
    .filter((deal) => deal.expectedCloseDate)
    .sort(
      (a, b) =>
        new Date(a.expectedCloseDate ?? "").getTime() -
        new Date(b.expectedCloseDate ?? "").getTime(),
    )
    .slice(0, 4);
  const activitySeries = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 6 + index);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const count = recentActivities.filter((activity) => {
      const createdAt = new Date(activity.createdAt);
      return createdAt >= date && createdAt < nextDate;
    }).length;

    return { count, date };
  });
  const maxActivityCount = Math.max(...activitySeries.map((item) => item.count), 1);
  const busiestActivityDay = activitySeries.reduce(
    (best, item) => (item.count > best.count ? item : best),
    activitySeries[0] ?? { count: 0, date: new Date() },
  );
  const activeDays = activitySeries.filter((item) => item.count > 0).length;
  const relationshipItems = [
    {
      color: "hsl(var(--muted-foreground) / 0.28)",
      label: tr("Companies", "الشركات"),
      value: companiesTotal,
    },
    {
      color: "hsl(var(--info) / 0.28)",
      label: tr("Contacts", "جهات الاتصال"),
      value: contactsTotal,
    },
    {
      color: "hsl(var(--success) / 0.3)",
      label: tr("Open deals", "الصفقات المفتوحة"),
      value: openDeals.length,
    },
  ];
  const maxRelationshipValue = Math.max(...relationshipItems.map((item) => item.value), 1);
  const avgContactsPerCompany = companiesTotal === 0 ? 0 : contactsTotal / companiesTotal;
  const dealsPerHundredContacts =
    contactsTotal === 0 ? 0 : Math.round((openDeals.length / contactsTotal) * 100);

  const aiBriefBody =
    overdueTasks.length > 0
      ? tr(
          "Reduce task debt before pushing new opportunities deeper into the funnel.",
          "خفّف تراكم المهام قبل دفع فرص جديدة أعمق داخل القمع.",
        )
      : openDeals.length > 0
        ? tr(
            "Open value is healthy. Focus on advancing late-stage deals with clear owners and close dates.",
            "القيمة المفتوحة جيدة. ركّز على دفع الصفقات المتأخرة بمسؤول واضح وتاريخ إغلاق محدد.",
          )
        : tr(
            "Use the calm window to tighten data quality and create fresh pipeline coverage.",
            "استغل فترة الهدوء لتحسين جودة البيانات وخلق تغطية جديدة لخط المبيعات.",
          );

  const aiRecommendations = [
    overdueTasks.length > 0
      ? tr(
          "Resolve overdue tasks before creating additional follow-up work.",
          "أنهِ المهام المتأخرة قبل إنشاء متابعات إضافية.",
        )
      : tr(
          "Keep the task queue current by closing completed work immediately.",
          "حافظ على حداثة قائمة المهام بإغلاق الأعمال المنجزة فورًا.",
        ),
    dealsClosingSoon.length > 0
      ? tr(
          "Review near-term deals and confirm next meetings or proposals.",
          "راجع الصفقات القريبة وتأكد من الاجتماعات أو العروض التالية.",
        )
      : tr(
          "Open deals need clearer close dates to improve forecasting confidence.",
          "الصفقات المفتوحة تحتاج تواريخ إغلاق أوضح لتحسين الثقة بالتوقعات.",
        ),
    tr(
      "Treat contacts, companies, and deals as one operating graph rather than separate lists.",
      "تعامل مع جهات الاتصال والشركات والصفقات كشبكة تشغيل واحدة لا كقوائم منفصلة.",
    ),
  ];
  const aiBriefHeadline =
    overdueTasks.length > 0
      ? tr("Recover execution discipline", "استعد انضباط التنفيذ")
      : dealsClosingSoon.length > 0
        ? tr("Turn momentum into closes", "حوّل الزخم إلى إغلاقات")
        : tr("Use the calm window well", "استغل فترة الهدوء بذكاء");
  const aiBriefStatus =
    overdueTasks.length > 0
      ? {
          cta: tr("Open task queue", "افتح قائمة المهام"),
          href: "/tasks" as Route,
          label: tr("Needs attention", "يتطلب انتباهًا"),
          signal: tr(
            "Task debt is slowing forward motion.",
            "تراكم المهام يبطئ التقدم إلى الأمام.",
          ),
          tone: "warning" as const,
        }
      : dealsClosingSoon.length > 0
        ? {
            cta: tr("Review active deals", "راجع الصفقات النشطة"),
            href: "/deals" as Route,
            label: tr("In motion", "قيد الحركة"),
            signal: tr(
              "Near-term revenue is available if follow-up stays tight.",
              "الإيراد القريب متاح إذا بقيت المتابعة منضبطة.",
            ),
            tone: "info" as const,
          }
        : {
            cta: tr("Expand coverage", "وسّع التغطية"),
            href: "/contacts" as Route,
            label: tr("Build mode", "وضع البناء"),
            signal: tr(
              "The workspace is quiet enough for proactive pipeline work.",
              "مساحة العمل هادئة بما يكفي لعمل استباقي على خط المبيعات.",
            ),
            tone: "success" as const,
          };
  const aiBriefSignals = [
    {
      hint: tr("Items blocking execution", "عناصر تعيق التنفيذ"),
      label: tr("Overdue", "متأخرة"),
      tone: overdueTasks.length > 0 ? ("warning" as const) : ("success" as const),
      value: overdueTasks.length,
    },
    {
      hint: tr("Work due in the current day", "أعمال مستحقة اليوم"),
      label: tr("Today", "اليوم"),
      tone: todayTasks.length > 0 ? ("info" as const) : ("neutral" as const),
      value: todayTasks.length,
    },
    {
      hint: tr("Deals with near-term close dates", "صفقات بتاريخ إغلاق قريب"),
      label: tr("Closing soon", "إغلاق قريب"),
      tone: dealsClosingSoon.length > 0 ? ("success" as const) : ("neutral" as const),
      value: dealsClosingSoon.length,
    },
    {
      hint: tr("Active opportunities currently in play", "الفرص النشطة الموجودة حاليًا"),
      label: tr("Open deals", "صفقات مفتوحة"),
      tone: openDeals.length > 0 ? ("info" as const) : ("neutral" as const),
      value: openDeals.length,
    },
  ];

  const activityTypes = Array.from(
    new Set(recentActivities.map((activity) => activity.type)),
  ).slice(0, 6);

  const filteredDeals = openDeals
    .filter((deal) => dealFilter === "all" || deal.status === dealFilter)
    .filter((deal) => {
      if (!deferredSearch) return true;
      return [deal.title, stageNameById[deal.stageId] ?? "", deal.description ?? "", deal.id]
        .join(" ")
        .toLowerCase()
        .includes(deferredSearch);
    })
    .sort((a, b) => b.amount - a.amount);

  const filteredTasks = [...tasks]
    .filter((task) => {
      if (taskFilter === "all") return true;
      if (taskFilter === "done") return task.status === "DONE";
      return getTaskBucket(task) === taskFilter;
    })
    .filter((task) => {
      if (!deferredSearch) return true;
      return [task.title, task.relatedId, task.relatedType, task.id]
        .join(" ")
        .toLowerCase()
        .includes(deferredSearch);
    })
    .sort(sortTasksByPriority);

  const filteredActivities = recentActivities
    .filter((activity) => activityFilter === "all" || activity.type === activityFilter)
    .filter((activity) => {
      if (!deferredSearch) return true;
      return [
        activity.type,
        activity.entityType,
        activity.entityId,
        JSON.stringify(activity.metadata ?? {}),
      ]
        .join(" ")
        .toLowerCase()
        .includes(deferredSearch);
    });

  return (
    <>
      <PageHeader
        eyebrow={tr("Workspace overview", "نظرة عامة على مساحة العمل")}
        title={tr("Dashboard", "لوحة التحكم")}
        meta={
          <>
            <Badge tone="info">
              {openDeals.length} {tr("open deals", "صفقات مفتوحة")}
            </Badge>
            <Badge tone={overdueTasks.length > 0 ? "warning" : "success"}>
              {overdueTasks.length} {tr("overdue tasks", "مهام متأخرة")}
            </Badge>
          </>
        }
        actions={
          <>
            <Link href="/contacts/new" className="btn">
              {tr("Add contact", "إضافة جهة اتصال")}
            </Link>
            <Link href="/deals/new" className="btn btn-primary">
              {tr("Create opportunity", "إنشاء فرصة")}
            </Link>
          </>
        }
      />

      <section className="flex flex-col gap-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <SectionPanel
            className="p-3.5 md:col-span-2 xl:col-span-3"
            title={tr("AI operating brief", "الملخص التشغيلي بالذكاء الاصطناعي")}
          >
            <div className="overflow-hidden rounded-[24px] border border-border/85 bg-[linear-gradient(145deg,hsl(var(--info)/0.14),hsl(var(--background)/0.96)_42%,hsl(var(--surface2)/0.94))] p-3.5 shadow-[0_16px_34px_rgba(15,23,42,0.045)]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-surface/90 text-fg">
                      <Sparkles size={16} />
                    </div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mutedfg">
                      {tr("Operating focus", "تركيز التشغيل")}
                    </p>
                    <Badge tone={aiBriefStatus.tone}>{aiBriefStatus.label}</Badge>
                  </div>

                  <h3 className="mt-3 text-lg font-semibold tracking-[-0.04em] text-fg">
                    {aiBriefHeadline}
                  </h3>
                  <p className="mt-1.5 max-w-[42ch] text-sm leading-6 text-mutedfg">{aiBriefBody}</p>
                </div>

                <div className="rounded-[20px] border border-border/80 bg-surface/88 p-3 lg:max-w-[208px]">
                  <div className="flex items-center gap-2 text-fg">
                    <Radar size={15} />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mutedfg">
                      {tr("Live signal", "الإشارة المباشرة")}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-fg">{aiBriefStatus.signal}</p>
                </div>
              </div>

              <div className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
                {aiBriefSignals.map((signal) => (
                  <div
                    key={signal.label}
                    title={signal.hint}
                    className="rounded-lg border border-border/80 bg-surface/88 px-2.5 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-mutedfg">
                        {signal.label}
                      </p>
                      <span className="shrink-0 text-lg font-semibold tracking-[-0.03em] text-fg">
                        {signal.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {aiRecommendations.map((recommendation, index) => (
                  <article
                    key={recommendation}
                    className="rounded-xl border border-border/80 bg-surface/92 px-3 py-2.5 transition hover:border-fg/12 hover:bg-surface"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/75 bg-surface2/88 text-xs font-semibold text-fg">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedfg">
                          {tr("Next move", "الخطوة التالية")} {index + 1}
                        </p>
                        <p className="mt-1 text-sm leading-5 text-fg">{recommendation}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/75 pt-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedfg">
                    {tr("Suggested route", "المسار المقترح")}
                  </p>
                  <p className="mt-1 text-xs text-mutedfg">{aiBriefStatus.label}</p>
                </div>

                <Link
                  href={aiBriefStatus.href}
                  className="inline-flex items-center gap-2 rounded-full border border-border/85 bg-surface px-3 py-1.5 text-sm font-medium text-fg transition hover:border-fg/12 hover:bg-surface2"
                >
                  {aiBriefStatus.cta}
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </SectionPanel>

          <SectionPanel className="p-3.5" title={tr("Activity pulse", "نبض النشاط")}>
            <div className="rounded-[20px] border border-border/85 bg-surface2/68 p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-border/80 bg-surface px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedfg">
                    {tr("Events this week", "أحداث هذا الأسبوع")}
                  </p>
                  <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-fg">
                    {recentActivities.length}
                  </p>
                </div>
                <div className="rounded-xl border border-border/80 bg-surface px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedfg">
                    {tr("Busiest day", "اليوم الأكثر نشاطًا")}
                  </p>
                  <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-fg">
                    {busiestActivityDay.date.toLocaleDateString(locale, { weekday: "short" })}
                  </p>
                  <p className="mt-1 text-xs text-mutedfg">
                    {busiestActivityDay.count} {tr("events", "أحداث")}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <p className="muted-label">{tr("Last 7 days", "آخر 7 أيام")}</p>
                  <Badge tone={activeDays >= 5 ? "success" : "neutral"}>
                    {activeDays} {tr("active days", "أيام نشطة")}
                  </Badge>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {activitySeries.map(({ count, date }) => (
                    <div
                      key={date.toISOString()}
                      className="rounded-xl border border-border/80 bg-surface px-2 py-2.5"
                    >
                      <p className="text-center text-xs font-semibold text-fg">{count}</p>
                      <div className="mt-2 flex h-20 items-end justify-center rounded-[14px] bg-surface2/80 px-1.5 py-1.5">
                        <div
                          className="w-full rounded-full bg-fg"
                          style={{
                            height: `${Math.max((count / maxActivityCount) * 100, count ? 16 : 6)}%`,
                            opacity: count === maxActivityCount ? 1 : 0.82,
                          }}
                        />
                      </div>
                      <p className="mt-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-mutedfg">
                        {date.toLocaleDateString(locale, { weekday: "short" })}
                      </p>
                      <p className="mt-0.5 text-center text-[10px] text-mutedfg">
                        {date.toLocaleDateString(locale, { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionPanel>

          <SectionPanel className="p-3.5" title={tr("Relationship footprint", "بصمة العلاقات")}>
            <div className="rounded-[20px] border border-border/85 bg-surface2/65 p-3">
              <div className="space-y-2.5">
                {relationshipItems.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-fg">{item.label}</span>
                      <span className="text-mutedfg">{formatCompactNumber(item.value, locale)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          background: item.color,
                          width: `${Math.max((item.value / maxRelationshipValue) * 100, item.value ? 12 : 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-border/80 bg-surface px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedfg">
                    {tr("Contacts per company", "جهات الاتصال لكل شركة")}
                  </p>
                  <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-fg">
                    {avgContactsPerCompany.toFixed(1)}
                  </p>
                </div>
                <div className="rounded-xl border border-border/80 bg-surface px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedfg">
                    {tr("Deals per 100 contacts", "الصفقات لكل 100 جهة")}
                  </p>
                  <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-fg">
                    {dealsPerHundredContacts}
                  </p>
                </div>
              </div>
            </div>
          </SectionPanel>

          <SectionPanel
            className="p-3.5"
            title={tr("Upcoming closes", "الإغلاقات القادمة")}
            description={tr(
              "Deals that deserve fast confirmation before they stall.",
              "الصفقات التي تستحق تأكيدًا سريعًا قبل أن تتعطل.",
            )}
          >
            {dealsClosingSoon.length === 0 ? (
              <EmptyState
                title={tr("No close dates in motion", "لا توجد تواريخ إغلاق قريبة")}
                hint={tr(
                  "Add expected close dates to open opportunities so forecasting becomes actionable.",
                  "أضف تواريخ إغلاق متوقعة للفرص المفتوحة كي تصبح التوقعات قابلة للتنفيذ.",
                )}
              />
            ) : (
              <div className="space-y-1.5">
                {dealsClosingSoon.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/85 bg-surface2/70 px-3 py-2.5 transition hover:border-fg/12 hover:bg-surface"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-fg">{deal.title}</p>
                      <p className="mt-1 truncate text-xs text-mutedfg">
                        {stageNameById[deal.stageId] ?? deal.stageId} ·{" "}
                        {formatDateLabel(deal.expectedCloseDate, locale)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-fg">
                      {formatCurrency(deal.amount, deal.currency, locale, true)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </SectionPanel>
        </div>

        <SectionPanel
          className="order-2 p-3.5"
          title={tr("Workspace workbench", "لوحة العمل")}
          description={tr(
            "One focused surface for scanning opportunities, execution work, and recent activity.",
            "سطح مركّز واحد لفحص الفرص وأعمال التنفيذ والنشاط الأخير.",
          )}
          action={
            <FilterChips
              chips={[
                {
                  key: "pipeline",
                  label: tr("Pipeline", "خط المبيعات"),
                  active: focusView === "pipeline",
                  onClick: () => setFocusView("pipeline"),
                  count: openDeals.length,
                },
                {
                  key: "tasks",
                  label: tr("Tasks", "المهام"),
                  active: focusView === "tasks",
                  onClick: () => setFocusView("tasks"),
                  count: openTasks.length,
                },
                {
                  key: "activity",
                  label: tr("Activity", "النشاط"),
                  active: focusView === "activity",
                  onClick: () => setFocusView("activity"),
                  count: recentActivities.length,
                },
              ]}
            />
          }
        >
          <div className="mb-3 flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {focusView === "pipeline" ? (
                <FilterChips
                  chips={[
                    {
                      key: "open",
                      label: tr("Open", "مفتوحة"),
                      active: dealFilter === "OPEN",
                      onClick: () => setDealFilter("OPEN"),
                      count: openDeals.length,
                    },
                    {
                      key: "all",
                      label: tr("All", "الكل"),
                      active: dealFilter === "all",
                      onClick: () => setDealFilter("all"),
                      count: deals.length,
                    },
                    {
                      key: "won",
                      label: tr("Won", "رابحة"),
                      active: dealFilter === "WON",
                      onClick: () => setDealFilter("WON"),
                      count: wonDeals.length,
                    },
                    {
                      key: "lost",
                      label: tr("Lost", "خاسرة"),
                      active: dealFilter === "LOST",
                      onClick: () => setDealFilter("LOST"),
                      count: lostDeals.length,
                    },
                  ]}
                />
              ) : null}

              {focusView === "tasks" ? (
                <FilterChips
                  chips={[
                    {
                      key: "all",
                      label: tr("All", "الكل"),
                      active: taskFilter === "all",
                      onClick: () => setTaskFilter("all"),
                      count: tasks.length,
                    },
                    {
                      key: "overdue",
                      label: tr("Overdue", "متأخرة"),
                      active: taskFilter === "overdue",
                      onClick: () => setTaskFilter("overdue"),
                      count: overdueTasks.length,
                    },
                    {
                      key: "today",
                      label: tr("Today", "اليوم"),
                      active: taskFilter === "today",
                      onClick: () => setTaskFilter("today"),
                      count: todayTasks.length,
                    },
                    {
                      key: "upcoming",
                      label: tr("Upcoming", "قادمة"),
                      active: taskFilter === "upcoming",
                      onClick: () => setTaskFilter("upcoming"),
                      count: upcomingTasks.length,
                    },
                    {
                      key: "done",
                      label: tr("Done", "مكتملة"),
                      active: taskFilter === "done",
                      onClick: () => setTaskFilter("done"),
                      count: doneTasks.length,
                    },
                  ]}
                />
              ) : null}

              {focusView === "activity" ? (
                <FilterChips
                  chips={[
                    {
                      key: "all",
                      label: tr("All", "الكل"),
                      active: activityFilter === "all",
                      onClick: () => setActivityFilter("all"),
                      count: recentActivities.length,
                    },
                    ...activityTypes.map((type) => ({
                      key: type,
                      label: type,
                      active: activityFilter === type,
                      onClick: () => setActivityFilter(type),
                    })),
                  ]}
                />
              ) : null}
            </div>

            <input
              className="input w-full lg:max-w-xs"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={tr("Search this view", "ابحث داخل هذا العرض")}
            />
          </div>

          {focusView === "pipeline" ? (
            filteredDeals.length === 0 ? (
              <EmptyState
                title={tr("No opportunities match this view", "لا توجد فرص تطابق هذا العرض")}
                hint={tr(
                  "Try a broader filter or create a new opportunity to keep the pipeline moving.",
                  "جرّب مرشحًا أوسع أو أنشئ فرصة جديدة لإبقاء خط المبيعات متحركًا.",
                )}
              />
            ) : (
              <DataTable
                rows={filteredDeals}
                columns={[
                  {
                    key: "deal",
                    label: tr("Opportunity", "الفرصة"),
                    render: (deal) => (
                      <div className="space-y-1">
                        <Link
                          href={`/deals/${deal.id}`}
                          className="font-medium text-fg hover:underline"
                        >
                          {deal.title}
                        </Link>
                        <p className="text-xs text-mutedfg">
                          {stageNameById[deal.stageId] ?? deal.stageId}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: "value",
                    label: tr("Value", "القيمة"),
                    render: (deal) => (
                      <div>
                        <p className="font-medium text-fg">
                          {formatCurrency(deal.amount, deal.currency, locale)}
                        </p>
                        <p className="text-xs text-mutedfg">
                          {formatRelativeDateLabel(deal.expectedCloseDate, locale)}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    label: tr("Status", "الحالة"),
                    render: (deal) => {
                      const status = dealStatusMeta(deal.status, tr);
                      return <Badge tone={status.tone}>{status.label}</Badge>;
                    },
                  },
                  {
                    key: "close",
                    label: tr("Expected close", "الإغلاق المتوقع"),
                    render: (deal) => formatDateLabel(deal.expectedCloseDate, locale),
                  },
                ]}
                footer={tr(
                  `${filteredDeals.length} opportunities in focus`,
                  `${filteredDeals.length} فرصة ضمن التركيز`,
                )}
              />
            )
          ) : null}

          {focusView === "tasks" ? (
            filteredTasks.length === 0 ? (
              <EmptyState
                title={tr("No tasks match this view", "لا توجد مهام تطابق هذا العرض")}
                hint={tr(
                  "The execution queue is clear for this filter. Switch views or create a follow-up.",
                  "قائمة التنفيذ فارغة لهذا المرشح. بدّل العرض أو أنشئ متابعة جديدة.",
                )}
              />
            ) : (
              <DataTable
                rows={filteredTasks}
                columns={[
                  {
                    key: "task",
                    label: tr("Task", "المهمة"),
                    render: (task) => (
                      <div className="space-y-1">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="font-medium text-fg hover:underline"
                        >
                          {task.title}
                        </Link>
                        <p className="text-xs text-mutedfg">
                          {relatedLabel(task, tr)} · {task.relatedId}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: "due",
                    label: tr("Due", "الاستحقاق"),
                    render: (task) => (
                      <div>
                        <p className="font-medium text-fg">{formatDateLabel(task.dueAt, locale)}</p>
                        <p className="text-xs text-mutedfg">
                          {formatRelativeDateLabel(task.dueAt, locale)}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    label: tr("Status", "الحالة"),
                    render: (task) => {
                      const status = taskStatusMeta(task.status, tr);
                      return <Badge tone={status.tone}>{status.label}</Badge>;
                    },
                  },
                ]}
                footer={tr(
                  `${filteredTasks.length} tasks in focus`,
                  `${filteredTasks.length} مهمة ضمن التركيز`,
                )}
              />
            )
          ) : null}

          {focusView === "activity" ? (
            filteredActivities.length === 0 ? (
              <EmptyState
                title={tr("No activity matches this view", "لا يوجد نشاط يطابق هذا العرض")}
                hint={tr(
                  "Change the filter to review other system events and team movements.",
                  "غيّر المرشح لمراجعة أحداث النظام وتحركات الفريق الأخرى.",
                )}
              />
            ) : (
              <DataTable
                rows={filteredActivities}
                columns={[
                  {
                    key: "event",
                    label: tr("Event", "الحدث"),
                    render: (activity) => (
                      <div className="space-y-1">
                        <Link
                          href={getActivityHref(activity) as Route}
                          className="font-medium text-fg hover:underline"
                        >
                          {activity.type}
                        </Link>
                        <p className="text-xs text-mutedfg">
                          {activity.entityType} · {activity.entityId}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: "context",
                    label: tr("Context", "السياق"),
                    render: (activity) => (
                      <span className="text-sm text-mutedfg">
                        {summarizeActivityMetadata(activity.metadata) ??
                          tr("System event", "حدث نظام")}
                      </span>
                    ),
                  },
                  {
                    key: "date",
                    label: tr("When", "الوقت"),
                    render: (activity) => (
                      <div>
                        <p className="font-medium text-fg">
                          {formatDateLabel(activity.createdAt, locale)}
                        </p>
                        <p className="text-xs text-mutedfg">
                          {formatRelativeDateLabel(activity.createdAt, locale)}
                        </p>
                      </div>
                    ),
                  },
                ]}
                footer={
                  <div className="flex items-center justify-between gap-3">
                    <span>
                      {tr(
                        `${filteredActivities.length} events in focus`,
                        `${filteredActivities.length} حدثًا ضمن التركيز`,
                      )}
                    </span>
                    <Link
                      href="/reports"
                      className="inline-flex items-center gap-1 font-medium text-fg hover:underline"
                    >
                      {tr("Open reports", "فتح التقارير")}
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                }
              />
            )
          ) : null}
        </SectionPanel>

        <SectionPanel className="order-1 p-3.5" title={tr("Pipeline flow", "تدفق خط المبيعات")}>
          {stageSummaries.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-surface2/70 px-4 py-4 text-sm text-mutedfg">
              {tr("Add stages to generate the flow diagram.", "أضف مراحل لإظهار مخطط التدفق.")}
            </p>
          ) : (
            <div className="overflow-x-auto pb-1">
              <div className="flex min-w-[560px] items-stretch gap-1.5">
                {stageSummaries.map((stage, index) => (
                  <div key={stage.id} className="contents">
                    <article className="min-w-[120px] flex-1 rounded-[18px] border border-border/85 bg-surface2/70 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-mutedfg">
                            {stage.name}
                          </p>
                          <p className="mt-1.5 text-2xl font-semibold tracking-[-0.04em] text-fg">
                            {stage.count}
                          </p>
                        </div>
                        <Badge tone={stage.count > 0 ? "info" : "neutral"}>{stage.share}%</Badge>
                      </div>
                      <div className="mt-3 h-1.5 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-fg"
                          style={{
                            width: `${Math.max((stage.count / maxStageCount) * 100, stage.count ? 10 : 0)}%`,
                          }}
                        />
                      </div>
                    </article>

                    {index < stageSummaries.length - 1 ? (
                      <div className="flex w-5 shrink-0 items-center justify-center">
                        <div className="flex w-full items-center gap-1">
                          <span className="h-px flex-1 bg-border/90" />
                          <span className="h-1.5 w-1.5 rounded-full bg-border/90" />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionPanel>
      </section>
    </>
  );
}
