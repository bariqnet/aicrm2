import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/Badge";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard, MetricGrid, PageHeader, SectionPanel } from "@/components/ui/workspace";
import type { Company, Contact, Deal, Task } from "@/lib/crm-types";
import {
  formatDateLabel,
  formatRelativeDateLabel,
  getTaskBucket,
  relatedTypeLabel,
  sortTasksByPriority,
  taskStatusMeta,
} from "@/lib/crm-presentation";
import { serverApiRequest, type ServerListResponse } from "@/lib/server-crm";
import { getDateLocale, getServerLanguage, pickByLanguage } from "@/lib/server-language";

function buildRelatedHref(task: Task): string {
  if (task.relatedType === "contact") return `/contacts/${task.relatedId}`;
  if (task.relatedType === "company") return `/companies/${task.relatedId}`;
  if (task.relatedType === "deal") return `/deals/${task.relatedId}`;
  return `/tasks/${task.relatedId}`;
}

export default async function TasksPage() {
  const language = await getServerLanguage();
  const locale = getDateLocale(language);
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);

  const [tasksPayload, contactsPayload, companiesPayload, dealsPayload] = await Promise.all([
    serverApiRequest<ServerListResponse<Task>>("/tasks"),
    serverApiRequest<ServerListResponse<Contact>>("/contacts"),
    serverApiRequest<ServerListResponse<Company>>("/companies"),
    serverApiRequest<ServerListResponse<Deal>>("/deals"),
  ]);

  const tasks = tasksPayload.rows ?? [];
  const contactsById = new Map(
    (contactsPayload.rows ?? []).map((contact) => [
      contact.id,
      `${contact.firstName} ${contact.lastName}`.trim(),
    ]),
  );
  const companiesById = new Map(
    (companiesPayload.rows ?? []).map((company) => [company.id, company.name]),
  );
  const dealsById = new Map((dealsPayload.rows ?? []).map((deal) => [deal.id, deal.title]));

  const taskRows = [...tasks]
    .map((task) => {
      const relatedName =
        task.relatedType === "contact"
          ? contactsById.get(task.relatedId)
          : task.relatedType === "company"
            ? companiesById.get(task.relatedId)
            : task.relatedType === "deal"
              ? dealsById.get(task.relatedId)
              : tasks.find((item) => item.id === task.relatedId)?.title;

      return {
        ...task,
        bucket: getTaskBucket(task),
        relatedName: relatedName ?? task.relatedId,
      };
    })
    .sort(sortTasksByPriority);

  const openTasks = taskRows.filter((task) => task.status === "OPEN");
  const doneTasks = taskRows.filter((task) => task.status === "DONE");
  const overdueTasks = taskRows.filter((task) => task.bucket === "overdue");
  const todayTasks = taskRows.filter((task) => task.bucket === "today");
  const focusQueue = taskRows.filter((task) => task.bucket !== "done").slice(0, 5);

  return (
    <main className="app-page">
      <PageHeader
        eyebrow={tr("Execution workspace", "مساحة التنفيذ")}
        title={tr("Tasks", "المهام")}
        description={tr(
          "Daily work is easier to scan when due dates, related records, and status sit in one operational table instead of separate buckets.",
          "يصبح العمل اليومي أسهل في الفحص عندما تجتمع تواريخ الاستحقاق والسجلات المرتبطة والحالة في جدول تشغيلي واحد بدلًا من قوائم منفصلة.",
        )}
        actions={
          <Link href="/tasks/new" className="btn btn-primary">
            {tr("New task", "مهمة جديدة")}
          </Link>
        }
      />

      <MetricGrid>
        <MetricCard
          label={tr("Open tasks", "المهام المفتوحة")}
          value={openTasks.length}
          hint={tr("Current execution queue", "قائمة التنفيذ الحالية")}
        />
        <MetricCard
          label={tr("Overdue", "متأخرة")}
          value={overdueTasks.length}
          hint={tr("Items already past due", "عناصر تجاوزت موعدها")}
          tone={overdueTasks.length > 0 ? "danger" : "success"}
        />
        <MetricCard
          label={tr("Due today", "مستحقة اليوم")}
          value={todayTasks.length}
          hint={tr("Immediate commitments", "التزامات فورية")}
          tone={todayTasks.length > 0 ? "warning" : "default"}
        />
        <MetricCard
          label={tr("Completed", "مكتملة")}
          value={doneTasks.length}
          hint={tr("Finished execution items", "عناصر التنفيذ المنجزة")}
          tone="accent"
        />
      </MetricGrid>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_340px]">
        <SectionPanel
          title={tr("Task queue", "قائمة المهام")}
          description={tr(
            "A unified queue for execution work across contacts, accounts, and opportunities.",
            "قائمة موحدة لأعمال التنفيذ عبر جهات الاتصال والحسابات والفرص.",
          )}
        >
          {taskRows.length === 0 ? (
            <EmptyState
              title={tr("No tasks yet", "لا توجد مهام بعد")}
              hint={tr(
                "Create the first task to start turning relationship intent into visible execution.",
                "أنشئ المهمة الأولى لبدء تحويل نية العلاقة إلى تنفيذ ظاهر.",
              )}
              action={
                <Link href="/tasks/new" className="btn btn-primary">
                  {tr("Create task", "إنشاء مهمة")}
                </Link>
              }
            />
          ) : (
            <DataTable
              rows={taskRows}
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
                      <p className="text-xs text-mutedfg">{task.id}</p>
                    </div>
                  ),
                },
                {
                  key: "due",
                  label: tr("Due", "الاستحقاق"),
                  render: (task) => (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-fg">
                        {formatDateLabel(task.dueAt, locale)}
                      </p>
                      <p className="text-xs text-mutedfg">
                        {formatRelativeDateLabel(task.dueAt, locale)}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "related",
                  label: tr("Related record", "السجل المرتبط"),
                  render: (task) => (
                    <div className="space-y-1">
                      <Link
                        href={buildRelatedHref(task) as Route}
                        className="text-sm text-fg hover:underline"
                      >
                        {task.relatedName}
                      </Link>
                      <p className="text-xs text-mutedfg">
                        {relatedTypeLabel(task.relatedType, tr)}
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
              footer={tr(`${taskRows.length} tasks in queue`, `${taskRows.length} مهمة في القائمة`)}
            />
          )}
        </SectionPanel>

        <div className="space-y-4">
          <SectionPanel
            title={tr("Focus queue", "قائمة التركيز")}
            description={tr(
              "The next work that deserves attention before the day fragments.",
              "الأعمال التالية التي تستحق الانتباه قبل أن يتشظى اليوم.",
            )}
          >
            {focusQueue.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-surface2/70 px-4 py-4 text-sm text-mutedfg">
                {tr("No open tasks in the queue.", "لا توجد مهام مفتوحة في القائمة.")}
              </p>
            ) : (
              <div className="space-y-2">
                {focusQueue.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="block rounded-2xl border border-border/85 bg-surface2/70 px-4 py-3 transition hover:border-fg/12 hover:bg-surface"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-fg">{task.title}</p>
                        <p className="mt-1 text-xs text-mutedfg">
                          {task.relatedName} · {formatRelativeDateLabel(task.dueAt, locale)}
                        </p>
                      </div>
                      <Badge
                        tone={
                          task.bucket === "overdue"
                            ? "danger"
                            : task.bucket === "today"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {task.bucket === "overdue"
                          ? tr("Overdue", "متأخرة")
                          : task.bucket === "today"
                            ? tr("Today", "اليوم")
                            : tr("Upcoming", "قادمة")}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </SectionPanel>

          <SectionPanel
            title={tr("Completed recently", "المكتملة مؤخرًا")}
            description={tr(
              "A quick check on work that has already been closed out.",
              "نظرة سريعة على الأعمال التي تم إغلاقها بالفعل.",
            )}
          >
            {doneTasks.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-surface2/70 px-4 py-4 text-sm text-mutedfg">
                {tr("No completed tasks yet.", "لا توجد مهام مكتملة بعد.")}
              </p>
            ) : (
              <div className="space-y-2">
                {doneTasks.slice(0, 5).map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="block rounded-2xl border border-border/85 bg-surface2/70 px-4 py-3 transition hover:border-fg/12 hover:bg-surface"
                  >
                    <p className="text-sm font-medium text-fg">{task.title}</p>
                    <p className="mt-1 text-xs text-mutedfg">{task.relatedName}</p>
                  </Link>
                ))}
              </div>
            )}
          </SectionPanel>
        </div>
      </section>
    </main>
  );
}
