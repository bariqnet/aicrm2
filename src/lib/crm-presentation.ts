import type { Deal, Invoice, Task } from "@/lib/crm-types";

export type TrFn = (english: string, arabic: string) => string;
export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatCurrency(
  amount: number,
  currency: string,
  locale: string,
  compact = false,
): string {
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

export function summarizeCurrencyTotals(
  rows: Array<{ amount: number; currency: string }>,
  locale: string,
  emptyLabel: string,
  mixedLabel: (count: number) => string,
): string {
  if (rows.length === 0) return emptyLabel;

  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.currency, (totals.get(row.currency) ?? 0) + row.amount);
  }

  const entries = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  if (entries.length === 1) {
    return formatCurrency(entries[0][1], entries[0][0], locale, true);
  }

  return `${formatCurrency(entries[0][1], entries[0][0], locale, true)} · ${mixedLabel(entries.length)}`;
}

export function formatCompactNumber(value: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: value < 10 ? 1 : 0,
    }).format(value);
  } catch {
    return value.toLocaleString(locale);
  }
}

export function formatDateLabel(
  value: string | null | undefined,
  locale: string,
  fallback = "-",
): string {
  const parsed = parseDate(value);
  if (!parsed) return fallback;
  return parsed.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTimeLabel(
  value: string | null | undefined,
  locale: string,
  fallback = "-",
): string {
  const parsed = parseDate(value);
  if (!parsed) return fallback;
  return parsed.toLocaleString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelativeDateLabel(
  value: string | null | undefined,
  locale: string,
  fallback = "-",
): string {
  const parsed = parseDate(value);
  if (!parsed) return fallback;

  const diffMinutes = Math.round((parsed.getTime() - Date.now()) / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute");

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, "day");

  return formatDateLabel(value, locale, fallback);
}

export function getTaskBucket(
  task: Pick<Task, "status" | "dueAt">,
): "overdue" | "today" | "upcoming" | "done" {
  if (task.status === "DONE") return "done";

  const dueAt = parseDate(task.dueAt);
  if (!dueAt) return "upcoming";

  const now = new Date();
  const dueDate = new Date(dueAt.getFullYear(), dueAt.getMonth(), dueAt.getDate());
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (dueDate.getTime() < nowDate.getTime()) return "overdue";
  if (dueDate.getTime() === nowDate.getTime()) return "today";
  return "upcoming";
}

export function sortTasksByPriority(a: Task, b: Task): number {
  const bucketOrder = { overdue: 0, today: 1, upcoming: 2, done: 3 };
  const aBucket = getTaskBucket(a);
  const bBucket = getTaskBucket(b);

  if (bucketOrder[aBucket] !== bucketOrder[bBucket]) {
    return bucketOrder[aBucket] - bucketOrder[bBucket];
  }

  const aTime = parseDate(a.dueAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const bTime = parseDate(b.dueAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  if (aTime !== bTime) return aTime - bTime;

  return a.title.localeCompare(b.title);
}

export function taskStatusMeta(status: Task["status"], tr: TrFn) {
  if (status === "DONE") {
    return { label: tr("Done", "مكتملة"), tone: "success" as const };
  }

  return { label: tr("Open", "مفتوحة"), tone: "info" as const };
}

export function dealStatusMeta(status: Deal["status"], tr: TrFn) {
  if (status === "WON") {
    return { label: tr("Won", "رابحة"), tone: "success" as const };
  }

  if (status === "LOST") {
    return { label: tr("Lost", "خاسرة"), tone: "danger" as const };
  }

  return { label: tr("Open", "مفتوحة"), tone: "info" as const };
}

export function invoiceStatusMeta(status: Invoice["status"], tr: TrFn) {
  if (status === "PAID") {
    return { label: tr("Paid", "مدفوعة"), tone: "success" as const };
  }

  if (status === "OVERDUE") {
    return { label: tr("Overdue", "متأخرة"), tone: "danger" as const };
  }

  if (status === "PARTIALLY_PAID") {
    return { label: tr("Partially paid", "مدفوعة جزئيًا"), tone: "warning" as const };
  }

  if (status === "VOID") {
    return { label: tr("Void", "ملغاة"), tone: "neutral" as const };
  }

  if (status === "SENT") {
    return { label: tr("Sent", "مرسلة"), tone: "info" as const };
  }

  return { label: tr("Draft", "مسودة"), tone: "neutral" as const };
}

export function relatedTypeLabel(type: Task["relatedType"], tr: TrFn): string {
  if (type === "contact") return tr("Contact", "جهة اتصال");
  if (type === "company") return tr("Company", "شركة");
  if (type === "deal") return tr("Deal", "صفقة");
  return tr("Task", "مهمة");
}

export function getInitials(value: string): string {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "?";
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}
