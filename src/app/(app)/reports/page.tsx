import Link from "next/link";
import { Badge } from "@/components/Badge";
import { DataTable } from "@/components/DataTable";
import { MetricCard, MetricGrid, PageHeader, SectionPanel } from "@/components/ui/workspace";
import type { Deal, Invoice, Stage, Task } from "@/lib/crm-types";
import {
  dealStatusMeta,
  formatCurrency,
  invoiceStatusMeta,
  summarizeCurrencyTotals,
} from "@/lib/crm-presentation";
import { serverApiRequest, type ServerListResponse } from "@/lib/server-crm";
import { getDateLocale, getServerLanguage, pickByLanguage } from "@/lib/server-language";

function daysPastDue(value: string | null | undefined) {
  if (!value) return 0;
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return 0;
  const diff = Date.now() - due.getTime();
  return Math.max(Math.floor(diff / (1000 * 60 * 60 * 24)), 0);
}

export default async function ReportsPage() {
  const language = await getServerLanguage();
  const locale = getDateLocale(language);
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);

  const [dealsPayload, stagesPayload, tasksPayload, invoicesPayload] = await Promise.all([
    serverApiRequest<ServerListResponse<Deal>>("/deals"),
    serverApiRequest<ServerListResponse<Stage>>("/stages"),
    serverApiRequest<ServerListResponse<Task>>("/tasks"),
    serverApiRequest<ServerListResponse<Invoice>>("/invoices"),
  ]);

  const deals = dealsPayload.rows ?? [];
  const stages = [...(stagesPayload.rows ?? [])].sort((a, b) => a.order - b.order);
  const tasks = tasksPayload.rows ?? [];
  const invoices = invoicesPayload.rows ?? [];

  const openDeals = deals.filter((deal) => deal.status === "OPEN");
  const wonDeals = deals.filter((deal) => deal.status === "WON");
  const lostDeals = deals.filter((deal) => deal.status === "LOST");
  const overdueTasks = tasks.filter(
    (task) => task.status === "OPEN" && daysPastDue(task.dueAt) > 0,
  );
  const overdueInvoices = invoices.filter((invoice) => invoice.status === "OVERDUE");
  const winRate =
    wonDeals.length + lostDeals.length === 0
      ? 0
      : Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100);

  const stageRows = stages.map((stage) => {
    const stageDeals = deals.filter((deal) => deal.stageId === stage.id);
    const openStageDeals = stageDeals.filter((deal) => deal.status === "OPEN");

    return {
      ...stage,
      openCount: openStageDeals.length,
      totalCount: stageDeals.length,
      wonCount: stageDeals.filter((deal) => deal.status === "WON").length,
    };
  });

  const invoiceRows = invoices
    .filter((invoice) => invoice.status !== "VOID")
    .sort((a, b) => daysPastDue(b.dueAt) - daysPastDue(a.dueAt))
    .slice(0, 8);

  return (
    <main className="app-page">
      <PageHeader
        eyebrow={tr("Reporting workspace", "مساحة التقارير")}
        title={tr("Reports", "التقارير")}
        description={tr(
          "These summaries highlight conversion structure, execution drag, and billing risk so managers can act without exporting data first.",
          "تسلّط هذه الملخصات الضوء على بنية التحويل وتعثر التنفيذ ومخاطر الفوترة كي يتصرف المديرون دون تصدير البيانات أولًا.",
        )}
        actions={
          <Link href="/deals" className="btn">
            {tr("Open pipeline", "فتح خط المبيعات")}
          </Link>
        }
      />

      <MetricGrid>
        <MetricCard
          label={tr("Open opportunities", "الفرص المفتوحة")}
          value={openDeals.length}
          hint={tr("Current pipeline count", "عدد خط المبيعات الحالي")}
        />
        <MetricCard
          label={tr("Win rate", "معدل الفوز")}
          value={`${winRate}%`}
          hint={tr(`${wonDeals.length} won deals`, `${wonDeals.length} صفقة رابحة`)}
          tone="accent"
        />
        <MetricCard
          label={tr("Overdue tasks", "المهام المتأخرة")}
          value={overdueTasks.length}
          hint={tr("Execution drag inside the workspace", "تعثر التنفيذ داخل مساحة العمل")}
          tone={overdueTasks.length > 0 ? "warning" : "success"}
        />
        <MetricCard
          label={tr("Overdue invoices", "الفواتير المتأخرة")}
          value={overdueInvoices.length}
          hint={tr("Billing exposure requiring follow-up", "تعرض فوترة يحتاج إلى متابعة")}
          tone={overdueInvoices.length > 0 ? "danger" : "success"}
        />
      </MetricGrid>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <SectionPanel
          title={tr("Pipeline structure", "بنية خط المبيعات")}
          description={tr(
            "Stage-level visibility for volume, win concentration, and active value.",
            "رؤية على مستوى المراحل للحجم وتركيز الفوز والقيمة النشطة.",
          )}
        >
          <DataTable
            rows={stageRows}
            columns={[
              {
                key: "stage",
                label: tr("Stage", "المرحلة"),
                render: (stage) => (
                  <div className="space-y-1">
                    <p className="font-medium text-fg">{stage.name}</p>
                    <p className="text-xs text-mutedfg">
                      {stage.totalCount} {tr("total deals", "إجمالي الصفقات")}
                    </p>
                  </div>
                ),
              },
              {
                key: "open",
                label: tr("Open deals", "الصفقات المفتوحة"),
                render: (stage) => stage.openCount,
              },
              {
                key: "won",
                label: tr("Won deals", "الصفقات الرابحة"),
                render: (stage) => (
                  <Badge tone={stage.wonCount > 0 ? "success" : "neutral"}>{stage.wonCount}</Badge>
                ),
              },
              {
                key: "value",
                label: tr("Open value", "القيمة المفتوحة"),
                render: (stage) =>
                  summarizeCurrencyTotals(
                    deals.filter((deal) => deal.stageId === stage.id && deal.status === "OPEN"),
                    locale,
                    tr("No value", "بدون قيمة"),
                    (count) => tr(`${count} currencies`, `${count} عملات`),
                  ),
              },
            ]}
          />
        </SectionPanel>

        <div className="space-y-4">
          <SectionPanel
            title={tr("Opportunity outcome", "نتيجة الفرص")}
            description={tr(
              "A compact read on how the funnel is currently resolving.",
              "قراءة مختصرة لكيفية إغلاق القمع حاليًا.",
            )}
          >
            <div className="space-y-2">
              {[
                { label: tr("Open", "مفتوحة"), count: openDeals.length, tone: "info" as const },
                { label: tr("Won", "رابحة"), count: wonDeals.length, tone: "success" as const },
                { label: tr("Lost", "خاسرة"), count: lostDeals.length, tone: "danger" as const },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-border/85 bg-surface2/70 px-4 py-3"
                >
                  <span className="text-sm font-medium text-fg">{item.label}</span>
                  <Badge tone={item.tone}>{item.count}</Badge>
                </div>
              ))}
            </div>
          </SectionPanel>

          <SectionPanel
            title={tr("Billing watchlist", "قائمة مراقبة الفوترة")}
            description={tr(
              "Invoices that most likely need action from operations or finance.",
              "الفواتير الأكثر حاجة إلى إجراء من العمليات أو المالية.",
            )}
          >
            <div className="space-y-2">
              {invoiceRows.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border bg-surface2/70 px-4 py-4 text-sm text-mutedfg">
                  {tr("No invoices available for review.", "لا توجد فواتير متاحة للمراجعة.")}
                </p>
              ) : (
                invoiceRows.map((invoice) => {
                  const status = invoiceStatusMeta(invoice.status, tr);
                  return (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}`}
                      className="block rounded-2xl border border-border/85 bg-surface2/70 px-4 py-3 transition hover:border-fg/12 hover:bg-surface"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-fg">
                            {invoice.invoiceNumber} · {invoice.title}
                          </p>
                          <p className="mt-1 text-xs text-mutedfg">
                            {formatCurrency(invoice.amount, invoice.currency, locale)} ·{" "}
                            {daysPastDue(invoice.dueAt)}{" "}
                            {tr("days past due", "يومًا بعد الاستحقاق")}
                          </p>
                        </div>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </SectionPanel>
        </div>
      </section>

      <SectionPanel
        title={tr("Deal resolution sample", "عينة إغلاق الصفقات")}
        description={tr(
          "A quick review of recent deal outcomes with current status labeling.",
          "مراجعة سريعة لنتائج الصفقات مع تصنيف الحالة الحالي.",
        )}
      >
        <DataTable
          rows={deals.slice(0, 10)}
          columns={[
            {
              key: "deal",
              label: tr("Deal", "الصفقة"),
              render: (deal) => (
                <Link href={`/deals/${deal.id}`} className="font-medium text-fg hover:underline">
                  {deal.title}
                </Link>
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
              key: "amount",
              label: tr("Amount", "القيمة"),
              render: (deal) => formatCurrency(deal.amount, deal.currency, locale),
            },
            {
              key: "stage",
              label: tr("Stage", "المرحلة"),
              render: (deal) =>
                stages.find((stage) => stage.id === deal.stageId)?.name ?? deal.stageId,
            },
          ]}
        />
      </SectionPanel>
    </main>
  );
}
