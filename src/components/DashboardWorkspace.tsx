"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import {
  ArrowLeft,
  ActivitySquare,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  CircleDollarSign,
  KanbanSquare,
  Sparkles,
  Users2,
  Workflow,
  ArrowRight,
} from "lucide-react";
import { getDateLocale } from "@/lib/locale";
import { isRtlLanguage } from "@/lib/ui-direction";
import { cn } from "@/lib/utils";
import type { AppLanguage } from "@/lib/i18n";
import type { Activity, Deal, Stage, Task } from "@/lib/crm-types";

type DashboardWorkspaceProps = {
  activities: Activity[];
  companiesTotal: number;
  contactsTotal: number;
  deals: Deal[];
  language: AppLanguage;
  stages: Stage[];
  tasks: Task[];
};

type FocusView = "pipeline" | "execution" | "activity";
type TaskFilter = "all" | "overdue" | "today" | "upcoming" | "done";

function formatMoney(amount: number, currency: string, locale: string, compact = false): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: compact ? 1 : 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString(locale)}`;
  }
}

function formatDate(value: string | null | undefined, locale: string, fallback: string): string {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeDate(
  value: string | null | undefined,
  locale: string,
  fallback: string,
): string {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;

  const diffMs = parsed.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const absMinutes = Math.abs(diffMinutes);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (absMinutes < 60) return rtf.format(diffMinutes, "minute");

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, "day");

  return parsed.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

function prettifyToken(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getTaskBucket(task: Task): Exclude<TaskFilter, "all" | "done"> | "done" {
  if (task.status === "DONE") return "done";

  if (!task.dueAt) return "upcoming";

  const due = new Date(task.dueAt);
  if (Number.isNaN(due.getTime())) return "upcoming";

  const now = new Date();
  const dueDate = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (dueDate.getTime() < nowDate.getTime()) return "overdue";
  if (dueDate.getTime() === nowDate.getTime()) return "today";
  return "upcoming";
}

function taskSortValue(task: Task): number {
  if (task.status === "DONE") return Number.MAX_SAFE_INTEGER;
  if (!task.dueAt) return Number.MAX_SAFE_INTEGER - 1;

  const dueAt = new Date(task.dueAt).getTime();
  return Number.isNaN(dueAt) ? Number.MAX_SAFE_INTEGER - 1 : dueAt;
}

function activityHref(activity: Activity): string {
  const entityType = activity.entityType.toLowerCase();
  if (entityType.includes("deal")) return `/deals/${activity.entityId}`;
  if (entityType.includes("task")) return `/tasks/${activity.entityId}`;
  if (entityType.includes("contact")) return `/contacts/${activity.entityId}`;
  if (entityType.includes("company")) return `/companies/${activity.entityId}`;
  return "/dashboard";
}

function summarizeMetadata(metadata?: Record<string, unknown>): string | null {
  if (!metadata) return null;

  const entries = Object.entries(metadata)
    .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))
    .slice(0, 2);

  if (entries.length === 0) return null;

  return entries.map(([key, value]) => `${prettifyToken(key)}: ${String(value)}`).join(" • ");
}

function currencySummary(
  deals: Deal[],
  locale: string,
  emptyLabel: string,
  mixedLabel: (count: number) => string,
): string {
  if (deals.length === 0) return emptyLabel;

  const totals = new Map<string, number>();

  for (const deal of deals) {
    const current = totals.get(deal.currency) ?? 0;
    totals.set(deal.currency, current + deal.amount);
  }

  const entries = [...totals.entries()].sort((a, b) => b[1] - a[1]);

  if (entries.length === 1) {
    return formatMoney(entries[0][1], entries[0][0], locale);
  }

  const [topCurrency, topAmount] = entries[0];
  return `${formatMoney(topAmount, topCurrency, locale, true)} · ${mixedLabel(entries.length)}`;
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
  const isRtl = isRtlLanguage(language);

  const [focusView, setFocusView] = useState<FocusView>("pipeline");
  const [dealStatusFilter, setDealStatusFilter] = useState<Deal["status"]>("OPEN");
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [searchValue, setSearchValue] = useState("");
  const deferredSearch = useDeferredValue(searchValue.trim().toLowerCase());

  const orderedStages = [...stages].sort((a, b) => a.order - b.order);
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const openDeals = deals.filter((deal) => deal.status === "OPEN");
  const wonDeals = deals.filter((deal) => deal.status === "WON");
  const lostDeals = deals.filter((deal) => deal.status === "LOST");
  const openTasks = tasks.filter((task) => task.status === "OPEN");
  const doneTasks = tasks.filter((task) => task.status === "DONE");
  const overdueTasks = openTasks.filter((task) => getTaskBucket(task) === "overdue");
  const todayTasks = openTasks.filter((task) => getTaskBucket(task) === "today");
  const weeklyActivity = sortedActivities.filter((activity) => {
    const createdAt = new Date(activity.createdAt).getTime();
    return Number.isFinite(createdAt) && createdAt >= Date.now() - 7 * 24 * 60 * 60 * 1000;
  });

  const totalPipelineValue = currencySummary(
    openDeals,
    locale,
    tr("No open value", "لا توجد قيمة مفتوحة"),
    (count) => tr(`${count} currencies`, `${count} عملات`),
  );
  const closedDealsCount = wonDeals.length + lostDeals.length;
  const winRate =
    closedDealsCount === 0 ? 0 : Math.round((wonDeals.length / closedDealsCount) * 100);
  const taskCompletion =
    tasks.length === 0 ? 0 : Math.round((doneTasks.length / tasks.length) * 100);

  const signal = overdueTasks.length
    ? {
        title: tr("Overdue work is your pressure point.", "المهام المتأخرة هي نقطة الضغط الآن."),
        description: tr(
          "Clear the late task queue first, then push open deals forward.",
          "ابدأ بإنهاء المهام المتأخرة، ثم حرّك الصفقات المفتوحة إلى الأمام.",
        ),
      }
    : openDeals.length
      ? {
          title: tr("Pipeline momentum looks healthy.", "زخم خط المبيعات يبدو جيدًا."),
          description: tr(
            "Use the filters below to inspect deal value, stage concentration, and task coverage.",
            "استخدم المرشحات أدناه لفحص قيمة الصفقات وتركيز المراحل وتغطية المهام.",
          ),
        }
      : {
          title: tr("The workspace is calm right now.", "مساحة العمل هادئة الآن."),
          description: tr(
            "Use the quick actions to add fresh activity, tasks, or new pipeline cards.",
            "استخدم الإجراءات السريعة لإضافة نشاط جديد أو مهام أو بطاقات مبيعات جديدة.",
          ),
        };

  const activityTypes = Array.from(
    new Set(sortedActivities.map((activity) => activity.type).filter(Boolean)),
  ).slice(0, 5);

  const stageStats = orderedStages.map((stage) => {
    const stageDeals = deals.filter((deal) => deal.stageId === stage.id);
    const stageOpenDeals = stageDeals.filter((deal) => deal.status === "OPEN");

    return {
      id: stage.id,
      name: stage.name,
      totalCount: stageDeals.length,
      openCount: stageOpenDeals.length,
      valueLabel: currencySummary(stageOpenDeals, locale, tr("No value", "بدون قيمة"), (count) =>
        tr(`${count} currencies`, `${count} عملات`),
      ),
    };
  });

  const maxStageCount = Math.max(...stageStats.map((stage) => stage.totalCount), 1);

  const activityTrend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const count = sortedActivities.filter((activity) => {
      const createdAt = new Date(activity.createdAt).getTime();
      return createdAt >= date.getTime() && createdAt < nextDate.getTime();
    }).length;

    return {
      key: date.toISOString(),
      shortLabel: date.toLocaleDateString(locale, { weekday: "short" }),
      count,
    };
  });

  const maxActivityCount = Math.max(...activityTrend.map((item) => item.count), 1);

  const stageNameById = Object.fromEntries(orderedStages.map((stage) => [stage.id, stage.name]));
  const selectedStageName =
    stageFilter === "all"
      ? tr("All stages", "كل المراحل")
      : (stageNameById[stageFilter] ?? tr("Selected stage", "المرحلة المحددة"));

  const pipelineItems = deals
    .filter((deal) => deal.status === dealStatusFilter)
    .filter((deal) => stageFilter === "all" || deal.stageId === stageFilter)
    .filter((deal) => {
      if (!deferredSearch) return true;
      const haystack = [
        deal.title,
        deal.currency,
        deal.id,
        stageNameById[deal.stageId] ?? "",
        deal.description ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(deferredSearch);
    })
    .sort((a, b) => b.amount - a.amount);

  const executionItems = tasks
    .filter((task) => {
      if (taskFilter === "all") return true;
      if (taskFilter === "done") return task.status === "DONE";
      return task.status === "OPEN" && getTaskBucket(task) === taskFilter;
    })
    .filter((task) => {
      if (!deferredSearch) return true;
      const haystack = [task.title, task.relatedType, task.relatedId, task.id]
        .join(" ")
        .toLowerCase();
      return haystack.includes(deferredSearch);
    })
    .sort((a, b) => taskSortValue(a) - taskSortValue(b) || a.title.localeCompare(b.title));

  const activityItems = sortedActivities
    .filter((activity) => activityFilter === "all" || activity.type === activityFilter)
    .filter((activity) => {
      if (!deferredSearch) return true;
      const haystack = [
        activity.type,
        activity.entityType,
        activity.entityId,
        JSON.stringify(activity.metadata ?? {}),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(deferredSearch);
    });

  const focusTitle =
    focusView === "pipeline"
      ? tr("Pipeline spotlight", "تركيز خط المبيعات")
      : focusView === "execution"
        ? tr("Execution board", "لوحة التنفيذ")
        : tr("Activity radar", "رادار النشاط");

  const focusDescription =
    focusView === "pipeline"
      ? tr(
          `Inspect ${selectedStageName.toLowerCase()} and move value where it matters.`,
          `افحص ${selectedStageName} وحرّك القيمة إلى حيث يلزم.`,
        )
      : focusView === "execution"
        ? tr(
            "Switch the queue lens to isolate overdue work, today commitments, or completed output.",
            "بدّل منظور القائمة لعزل المهام المتأخرة أو التزامات اليوم أو الأعمال المنجزة.",
          )
        : tr(
            "Filter the feed by event type to see what changed most recently.",
            "رشّح السجل حسب نوع الحدث لمعرفة ما تغيّر مؤخرًا.",
          );

  const metricCards = [
    {
      key: "pipeline",
      label: tr("Pipeline book", "قيمة خط المبيعات"),
      value: totalPipelineValue,
      note: tr(`${openDeals.length} open deals`, `${openDeals.length} صفقة مفتوحة`),
      icon: CircleDollarSign,
      active: focusView === "pipeline" && dealStatusFilter === "OPEN",
      onClick: () => {
        setFocusView("pipeline");
        setDealStatusFilter("OPEN");
      },
    },
    {
      key: "wins",
      label: tr("Win rate", "معدل الفوز"),
      value: `${winRate}%`,
      note: tr(
        `${wonDeals.length} won / ${lostDeals.length} lost`,
        `${wonDeals.length} رابحة / ${lostDeals.length} خاسرة`,
      ),
      icon: KanbanSquare,
      active: focusView === "pipeline" && dealStatusFilter === "WON",
      onClick: () => {
        setFocusView("pipeline");
        setDealStatusFilter("WON");
      },
    },
    {
      key: "execution",
      label: tr("Action load", "حمل التنفيذ"),
      value: tr(`${overdueTasks.length} overdue`, `${overdueTasks.length} متأخرة`),
      note: tr(`${todayTasks.length} due today`, `${todayTasks.length} مستحقة اليوم`),
      icon: CircleAlert,
      active: focusView === "execution",
      onClick: () => {
        setFocusView("execution");
        setTaskFilter(overdueTasks.length ? "overdue" : "all");
      },
    },
    {
      key: "activity",
      label: tr("Recent motion", "الحركة الأخيرة"),
      value: tr(`${weeklyActivity.length} events`, `${weeklyActivity.length} حدثًا`),
      note: tr("Across the last 7 days", "خلال آخر 7 أيام"),
      icon: ActivitySquare,
      active: focusView === "activity",
      onClick: () => {
        setFocusView("activity");
        setActivityFilter("all");
      },
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.96),rgba(255,255,255,0.84)_42%,rgba(225,235,255,0.72)_100%)] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.09)] animate-[landing-fade-up_0.6s_ease-out_both] dark:bg-[radial-gradient(circle_at_top_left,rgba(31,41,55,0.96),rgba(17,24,39,0.92)_45%,rgba(15,23,42,0.9)_100%)] sm:p-6">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -left-14 top-8 h-32 w-32 rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-500/20" />
          <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-300/10" />
          <div className="absolute inset-y-0 right-10 w-px bg-gradient-to-b from-transparent via-fg/10 to-transparent" />
        </div>

        <div className="relative grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-1 text-xs font-medium text-mutedfg shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5">
                <Sparkles className="h-3.5 w-3.5" />
                {tr("Live workspace pulse", "نبض مساحة العمل")}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-3 py-1 text-xs font-medium text-mutedfg backdrop-blur dark:border-white/10 dark:bg-white/5">
                <Workflow className="h-3.5 w-3.5" />
                {tr(`${orderedStages.length} active stages`, `${orderedStages.length} مراحل نشطة`)}
              </span>
            </div>

            <div>
              <p className="muted-label">{tr("Dashboard", "لوحة التحكم")}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-[2.35rem]">
                {signal.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-mutedfg sm:text-[15px]">
                {signal.description}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/65 bg-white/65 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="muted-label">{tr("Attention", "الانتباه")}</p>
                <p className="mt-2 text-lg font-semibold text-fg">
                  {tr(`${overdueTasks.length} overdue tasks`, `${overdueTasks.length} مهام متأخرة`)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/65 bg-white/65 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="muted-label">{tr("Network", "الشبكة")}</p>
                <p className="mt-2 text-lg font-semibold text-fg">
                  {tr(`${contactsTotal} contacts`, `${contactsTotal} جهة اتصال`)}
                </p>
                <p className="mt-1 text-xs text-mutedfg">
                  {tr(`${companiesTotal} companies tracked`, `${companiesTotal} شركة قيد المتابعة`)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/65 bg-white/65 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="muted-label">{tr("Execution", "التنفيذ")}</p>
                <p className="mt-2 text-lg font-semibold text-fg">{taskCompletion}%</p>
                <p className="mt-1 text-xs text-mutedfg">
                  {tr(
                    `${doneTasks.length} completed of ${tasks.length}`,
                    `${doneTasks.length} مكتملة من أصل ${tasks.length}`,
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/deals/new" className="btn btn-primary">
                {tr("Add deal", "إضافة صفقة")}
                {isRtl ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              </Link>
              <Link href="/tasks/new" className="btn bg-white/70 dark:bg-white/5">
                {tr("Plan task", "تخطيط مهمة")}
              </Link>
              <Link href="/contacts/new" className="btn bg-white/70 dark:bg-white/5">
                {tr("Capture contact", "إضافة جهة اتصال")}
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <article className="rounded-[24px] border border-border/70 bg-surface/90 p-4 shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur animate-[landing-fade-up_0.7s_ease-out_both]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="muted-label">{tr("Task completion", "إنجاز المهام")}</p>
                  <p className="mt-1 text-sm text-mutedfg">
                    {tr("Based on all tracked tasks", "بناءً على جميع المهام المسجلة")}
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-fg/65" />
              </div>
              <div className="mt-5 flex items-center gap-4">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full p-2"
                  style={{
                    background: `conic-gradient(hsl(var(--foreground)) ${taskCompletion}%, hsl(var(--muted)) ${taskCompletion}% 100%)`,
                  }}
                >
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-surface">
                    <span className="text-2xl font-semibold">{taskCompletion}%</span>
                    <span className="text-[11px] uppercase tracking-[0.14em] text-mutedfg">
                      {tr("done", "تم")}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-mutedfg">
                  <p>
                    {tr(`${doneTasks.length} tasks completed`, `${doneTasks.length} مهام مكتملة`)}
                  </p>
                  <p>
                    {tr(
                      `${openTasks.length} still in motion`,
                      `${openTasks.length} ما زالت قيد التنفيذ`,
                    )}
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-[24px] border border-border/70 bg-surface/90 p-4 shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur animate-[landing-fade-up_0.8s_ease-out_both]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="muted-label">{tr("7-day pulse", "نبض 7 أيام")}</p>
                  <p className="mt-1 text-sm text-mutedfg">
                    {tr(
                      `${weeklyActivity.length} captured events`,
                      `${weeklyActivity.length} حدثًا مسجلًا`,
                    )}
                  </p>
                </div>
                <ActivitySquare className="h-5 w-5 text-fg/65" />
              </div>

              <div className="mt-5 grid grid-cols-7 items-end gap-2">
                {activityTrend.map((item) => (
                  <div key={item.key} className="space-y-2 text-center">
                    <div className="flex h-20 items-end justify-center rounded-2xl bg-muted/70 px-1 py-2">
                      <div
                        className="w-full rounded-full bg-fg/75 transition-all"
                        style={{
                          height: `${Math.max(12, (item.count / maxActivityCount) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-mutedfg">
                      {item.shortLabel}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <button
              key={card.key}
              type="button"
              onClick={card.onClick}
              className={cn(
                "group rounded-[24px] border p-4 text-left shadow-[0_18px_44px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-0.5 animate-[landing-fade-up_0.7s_ease-out_both]",
                card.active
                  ? "border-foreground/15 bg-foreground text-background"
                  : "border-border/70 bg-surface/95 text-fg hover:border-foreground/15",
              )}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className={cn("muted-label", card.active && "text-background/70")}>
                  {card.label}
                </p>
                <span
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-2xl border",
                    card.active
                      ? "border-background/15 bg-background/10 text-background"
                      : "border-border bg-surface2 text-fg/80",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-4 text-2xl font-semibold tracking-tight">{card.value}</p>
              <p
                className={cn("mt-2 text-sm", card.active ? "text-background/72" : "text-mutedfg")}
              >
                {card.note}
              </p>
            </button>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.28fr_0.72fr]">
        <article className="overflow-hidden rounded-[26px] border border-border/70 bg-surface/95 shadow-[0_20px_54px_rgba(15,23,42,0.08)] animate-[landing-fade-up_0.8s_ease-out_both]">
          <header className="border-b border-border/70 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="muted-label">{tr("Interactive board", "لوحة تفاعلية")}</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">{focusTitle}</h2>
                <p className="mt-2 text-sm text-mutedfg">{focusDescription}</p>
              </div>

              <label className="flex h-10 min-w-[220px] items-center gap-2 rounded-full border border-border bg-surface2 px-4 text-sm text-mutedfg focus-within:border-foreground/15 focus-within:bg-surface">
                <Sparkles className="h-4 w-4 shrink-0" />
                <input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder={tr("Search this board", "ابحث في هذه اللوحة")}
                  className="w-full bg-transparent text-fg outline-none placeholder:text-mutedfg"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFocusView("pipeline")}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-3 text-sm font-medium transition",
                  focusView === "pipeline"
                    ? "border-transparent bg-foreground text-background shadow-[0_14px_30px_rgba(15,23,42,0.14)]"
                    : "border-border bg-surface2 text-mutedfg hover:border-foreground/15 hover:text-fg",
                )}
              >
                {tr("Pipeline", "خط المبيعات")}
              </button>
              <button
                type="button"
                onClick={() => setFocusView("execution")}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-3 text-sm font-medium transition",
                  focusView === "execution"
                    ? "border-transparent bg-foreground text-background shadow-[0_14px_30px_rgba(15,23,42,0.14)]"
                    : "border-border bg-surface2 text-mutedfg hover:border-foreground/15 hover:text-fg",
                )}
              >
                {tr("Execution", "التنفيذ")}
              </button>
              <button
                type="button"
                onClick={() => setFocusView("activity")}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-3 text-sm font-medium transition",
                  focusView === "activity"
                    ? "border-transparent bg-foreground text-background shadow-[0_14px_30px_rgba(15,23,42,0.14)]"
                    : "border-border bg-surface2 text-mutedfg hover:border-foreground/15 hover:text-fg",
                )}
              >
                {tr("Activity", "النشاط")}
              </button>
            </div>

            {focusView === "pipeline" ? (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(["OPEN", "WON", "LOST"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setDealStatusFilter(status)}
                      className={cn(
                        "inline-flex h-9 items-center rounded-full border px-3 text-sm font-medium transition",
                        dealStatusFilter === status
                          ? "border-transparent bg-foreground text-background shadow-[0_14px_30px_rgba(15,23,42,0.14)]"
                          : "border-border bg-surface2 text-mutedfg hover:border-foreground/15 hover:text-fg",
                      )}
                    >
                      {status === "OPEN"
                        ? tr("Open", "مفتوحة")
                        : status === "WON"
                          ? tr("Won", "رابحة")
                          : tr("Lost", "خاسرة")}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setStageFilter("all")}
                    className={cn(
                      "inline-flex h-9 items-center rounded-full border px-3 text-sm font-medium transition",
                      stageFilter === "all"
                        ? "border-transparent bg-foreground text-background shadow-[0_14px_30px_rgba(15,23,42,0.14)]"
                        : "border-border bg-surface2 text-mutedfg hover:border-foreground/15 hover:text-fg",
                    )}
                  >
                    {tr("All stages", "كل المراحل")}
                  </button>
                  {stageStats.map((stage) => (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setStageFilter(stage.id)}
                      className={cn(
                        "inline-flex h-9 items-center rounded-full border px-3 text-sm font-medium transition",
                        stageFilter === stage.id
                          ? "border-transparent bg-foreground text-background shadow-[0_14px_30px_rgba(15,23,42,0.14)]"
                          : "border-border bg-surface2 text-mutedfg hover:border-foreground/15 hover:text-fg",
                      )}
                    >
                      {stage.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {focusView === "execution" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  [
                    { key: "all", label: tr("All tasks", "كل المهام") },
                    { key: "overdue", label: tr("Overdue", "متأخرة") },
                    { key: "today", label: tr("Today", "اليوم") },
                    { key: "upcoming", label: tr("Upcoming", "قادمة") },
                    { key: "done", label: tr("Completed", "مكتملة") },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTaskFilter(item.key)}
                    className={cn(
                      "inline-flex h-9 items-center rounded-full border px-3 text-sm font-medium transition",
                      taskFilter === item.key
                        ? "border-transparent bg-foreground text-background shadow-[0_14px_30px_rgba(15,23,42,0.14)]"
                        : "border-border bg-surface2 text-mutedfg hover:border-foreground/15 hover:text-fg",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}

            {focusView === "activity" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActivityFilter("all")}
                  className={cn(
                    "inline-flex h-9 items-center rounded-full border px-3 text-sm font-medium transition",
                    activityFilter === "all"
                      ? "border-transparent bg-foreground text-background shadow-[0_14px_30px_rgba(15,23,42,0.14)]"
                      : "border-border bg-surface2 text-mutedfg hover:border-foreground/15 hover:text-fg",
                  )}
                >
                  {tr("All activity", "كل النشاط")}
                </button>
                {activityTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setActivityFilter(type)}
                    className={cn(
                      "inline-flex h-9 items-center rounded-full border px-3 text-sm font-medium transition",
                      activityFilter === type
                        ? "border-transparent bg-foreground text-background shadow-[0_14px_30px_rgba(15,23,42,0.14)]"
                        : "border-border bg-surface2 text-mutedfg hover:border-foreground/15 hover:text-fg",
                    )}
                  >
                    {prettifyToken(type)}
                  </button>
                ))}
              </div>
            ) : null}
          </header>

          {focusView === "pipeline" ? (
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {pipelineItems.length === 0 ? (
                <div className="col-span-full rounded-[22px] border border-dashed border-border bg-surface2/60 p-8 text-center text-sm text-mutedfg">
                  {tr(
                    "No deals match the current filters.",
                    "لا توجد صفقات تطابق المرشحات الحالية.",
                  )}
                </div>
              ) : (
                pipelineItems.slice(0, 6).map((deal, index) => (
                  <Link
                    href={`/deals/${deal.id}`}
                    key={deal.id}
                    className="group rounded-[22px] border border-border/70 bg-surface2/55 p-4 transition hover:-translate-y-1 hover:border-foreground/15 hover:bg-surface hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)] animate-[landing-fade-up_0.8s_ease-out_both]"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-fg">{deal.title}</p>
                        <p className="mt-1 text-xs text-mutedfg">
                          {stageNameById[deal.stageId] ?? tr("Unknown stage", "مرحلة غير معروفة")}
                        </p>
                      </div>
                      <span className="inline-flex rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-mutedfg">
                        {deal.status === "OPEN"
                          ? tr("Open", "مفتوحة")
                          : deal.status === "WON"
                            ? tr("Won", "رابحة")
                            : tr("Lost", "خاسرة")}
                      </span>
                    </div>
                    <div className="mt-5 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-mutedfg">{tr("Value", "القيمة")}</p>
                        <p className="mt-1 text-2xl font-semibold tracking-tight">
                          {formatMoney(deal.amount, deal.currency, locale, deal.amount >= 100000)}
                        </p>
                      </div>
                      <div className="text-right text-xs text-mutedfg">
                        <p>{tr("Expected close", "الإغلاق المتوقع")}</p>
                        <p className="mt-1">
                          {formatDate(
                            deal.expectedCloseDate,
                            locale,
                            tr("No date set", "لا يوجد تاريخ محدد"),
                          )}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          ) : null}

          {focusView === "execution" ? (
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {executionItems.length === 0 ? (
                <div className="col-span-full rounded-[22px] border border-dashed border-border bg-surface2/60 p-8 text-center text-sm text-mutedfg">
                  {tr(
                    "No tasks match the current filters.",
                    "لا توجد مهام تطابق المرشحات الحالية.",
                  )}
                </div>
              ) : (
                executionItems.slice(0, 6).map((task, index) => {
                  const bucket = getTaskBucket(task);
                  const bucketLabel =
                    bucket === "done"
                      ? tr("Completed", "مكتملة")
                      : bucket === "overdue"
                        ? tr("Overdue", "متأخرة")
                        : bucket === "today"
                          ? tr("Today", "اليوم")
                          : tr("Upcoming", "قادمة");

                  return (
                    <Link
                      href={`/tasks/${task.id}`}
                      key={task.id}
                      className="group rounded-[22px] border border-border/70 bg-surface2/55 p-4 transition hover:-translate-y-1 hover:border-foreground/15 hover:bg-surface hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)] animate-[landing-fade-up_0.8s_ease-out_both]"
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-fg">{task.title}</p>
                          <p className="mt-1 text-xs text-mutedfg">
                            {tr("Related to", "مرتبط بـ")} {prettifyToken(task.relatedType)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium",
                            bucket === "overdue"
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : bucket === "today"
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : bucket === "done"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-sky-200 bg-sky-50 text-sky-700",
                          )}
                        >
                          {bucketLabel}
                        </span>
                      </div>

                      <div className="mt-5 flex items-end justify-between gap-3">
                        <div className="text-xs text-mutedfg">
                          <p>{tr("Due", "الاستحقاق")}</p>
                          <p className="mt-1">
                            {formatDate(
                              task.dueAt,
                              locale,
                              tr("No due date", "بدون تاريخ استحقاق"),
                            )}
                          </p>
                        </div>
                        <span className="text-xs text-mutedfg">{task.relatedId.slice(0, 8)}</span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          ) : null}

          {focusView === "activity" ? (
            <div className="grid gap-3 p-4">
              {activityItems.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-border bg-surface2/60 p-8 text-center text-sm text-mutedfg">
                  {tr(
                    "No activity matches the current filters.",
                    "لا يوجد نشاط يطابق المرشحات الحالية.",
                  )}
                </div>
              ) : (
                activityItems.slice(0, 7).map((activity, index) => (
                  <a
                    href={activityHref(activity)}
                    key={activity.id}
                    className="group rounded-[22px] border border-border/70 bg-surface2/55 p-4 transition hover:-translate-y-1 hover:border-foreground/15 hover:bg-surface hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)] animate-[landing-fade-up_0.8s_ease-out_both]"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-mutedfg">
                        {prettifyToken(activity.type)}
                      </span>
                      <span className="text-xs text-mutedfg">
                        {prettifyToken(activity.entityType)}
                      </span>
                    </div>

                    <p className="mt-3 font-medium text-fg">
                      {prettifyToken(activity.type)} · {prettifyToken(activity.entityType)}
                    </p>

                    <p className="mt-2 text-sm text-mutedfg">
                      {summarizeMetadata(activity.metadata) ??
                        tr(
                          "No additional metadata was captured for this event.",
                          "لم يتم تسجيل بيانات إضافية لهذا الحدث.",
                        )}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3 text-xs text-mutedfg">
                      <span>
                        {formatRelativeDate(
                          activity.createdAt,
                          locale,
                          tr("Unknown time", "وقت غير معروف"),
                        )}
                      </span>
                      <span>{activity.entityId.slice(0, 8)}</span>
                    </div>
                  </a>
                ))
              )}
            </div>
          ) : null}

          <footer className="border-t border-border/70 px-4 py-3 text-sm text-mutedfg sm:px-5">
            <Link
              href={
                focusView === "pipeline"
                  ? "/deals"
                  : focusView === "execution"
                    ? "/tasks"
                    : "/reports"
              }
              className="inline-flex items-center gap-2 font-medium text-fg hover:text-accent"
            >
              {focusView === "pipeline"
                ? tr("Open full pipeline", "فتح خط المبيعات الكامل")
                : focusView === "execution"
                  ? tr("Open full task board", "فتح لوحة المهام الكاملة")
                  : tr("Open reports", "فتح التقارير")}
              {isRtl ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            </Link>
          </footer>
        </article>

        <div className="space-y-4">
          <article className="overflow-hidden rounded-[26px] border border-border/70 bg-surface/95 shadow-[0_20px_54px_rgba(15,23,42,0.08)] animate-[landing-fade-up_0.9s_ease-out_both]">
            <header className="border-b border-border/70 p-4 sm:p-5">
              <p className="muted-label">{tr("Stage momentum", "زخم المراحل")}</p>
              <h2 className="mt-2 text-lg font-semibold">
                {tr("Where volume is sitting", "أماكن تركز الحجم")}
              </h2>
              <p className="mt-2 text-sm text-mutedfg">
                {tr(
                  "Click a stage to focus the board on it.",
                  "اضغط على أي مرحلة لتركيز اللوحة عليها.",
                )}
              </p>
            </header>

            <div className="space-y-3 p-4">
              {stageStats.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-border bg-surface2/60 p-6 text-sm text-mutedfg">
                  {tr("No stages are configured yet.", "لا توجد مراحل مهيأة بعد.")}
                </div>
              ) : (
                stageStats.map((stage, index) => (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => {
                      setFocusView("pipeline");
                      setStageFilter(stage.id);
                    }}
                    className={cn(
                      "w-full rounded-[22px] border p-4 text-left transition hover:-translate-y-0.5 animate-[landing-fade-up_0.8s_ease-out_both]",
                      stageFilter === stage.id && focusView === "pipeline"
                        ? "border-foreground/15 bg-foreground text-background shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
                        : "border-border/70 bg-surface2/55 hover:border-foreground/15",
                    )}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{stage.name}</p>
                        <p
                          className={cn(
                            "mt-1 text-xs",
                            stageFilter === stage.id && focusView === "pipeline"
                              ? "text-background/72"
                              : "text-mutedfg",
                          )}
                        >
                          {tr(
                            `${stage.openCount} open / ${stage.totalCount} total`,
                            `${stage.openCount} مفتوحة / ${stage.totalCount} إجمالي`,
                          )}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">{stage.valueLabel}</p>
                    </div>

                    <div
                      className={cn(
                        "mt-4 h-2 rounded-full",
                        stageFilter === stage.id && focusView === "pipeline"
                          ? "bg-background/15"
                          : "bg-muted",
                      )}
                    >
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          stageFilter === stage.id && focusView === "pipeline"
                            ? "bg-background"
                            : "bg-foreground/70",
                        )}
                        style={{
                          width: `${Math.max(12, (stage.totalCount / maxStageCount) * 100)}%`,
                        }}
                      />
                    </div>
                  </button>
                ))
              )}
            </div>
          </article>

          <article className="overflow-hidden rounded-[26px] border border-border/70 bg-surface/95 shadow-[0_20px_54px_rgba(15,23,42,0.08)] animate-[landing-fade-up_1s_ease-out_both]">
            <header className="border-b border-border/70 p-4 sm:p-5">
              <p className="muted-label">{tr("Quick launch", "إطلاق سريع")}</p>
              <h2 className="mt-2 text-lg font-semibold">
                {tr("Jump into work", "ابدأ العمل بسرعة")}
              </h2>
            </header>

            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <Link
                href="/contacts"
                className="rounded-[22px] border border-border/70 bg-surface2/55 p-4 transition hover:-translate-y-0.5 hover:border-foreground/15"
              >
                <Users2 className="h-5 w-5 text-fg/70" />
                <p className="mt-4 font-medium">{tr("Contacts", "جهات الاتصال")}</p>
                <p className="mt-1 text-sm text-mutedfg">
                  {tr("Review the relationship list.", "راجع قائمة العلاقات.")}
                </p>
              </Link>

              <Link
                href="/companies"
                className="rounded-[22px] border border-border/70 bg-surface2/55 p-4 transition hover:-translate-y-0.5 hover:border-foreground/15"
              >
                <Building2 className="h-5 w-5 text-fg/70" />
                <p className="mt-4 font-medium">{tr("Companies", "الشركات")}</p>
                <p className="mt-1 text-sm text-mutedfg">
                  {tr("Inspect account coverage.", "افحص تغطية الحسابات.")}
                </p>
              </Link>

              <Link
                href="/calendar"
                className="rounded-[22px] border border-border/70 bg-surface2/55 p-4 transition hover:-translate-y-0.5 hover:border-foreground/15"
              >
                <CalendarClock className="h-5 w-5 text-fg/70" />
                <p className="mt-4 font-medium">{tr("Calendar", "التقويم")}</p>
                <p className="mt-1 text-sm text-mutedfg">
                  {tr("See what is due next.", "اعرف ما هو المستحق لاحقًا.")}
                </p>
              </Link>

              <Link
                href="/reports"
                className="rounded-[22px] border border-border/70 bg-surface2/55 p-4 transition hover:-translate-y-0.5 hover:border-foreground/15"
              >
                <Workflow className="h-5 w-5 text-fg/70" />
                <p className="mt-4 font-medium">{tr("Reports", "التقارير")}</p>
                <p className="mt-1 text-sm text-mutedfg">
                  {tr("Open the deeper operating view.", "افتح العرض التشغيلي الأعمق.")}
                </p>
              </Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
