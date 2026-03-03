import Link from "next/link";
import type { Activity, Deal, Task } from "@/lib/crm-types";
import { serverApiRequest, type ServerListResponse } from "@/lib/server-crm";
import { getDateLocale, getServerLanguage, pickByLanguage } from "@/lib/server-language";

export default async function DashboardPage() {
  const language = await getServerLanguage();
  const locale = getDateLocale(language);
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);

  const [dealsPayload, tasksPayload, activitiesPayload] = await Promise.all([
    serverApiRequest<ServerListResponse<Deal>>("/deals"),
    serverApiRequest<ServerListResponse<Task>>("/tasks"),
    serverApiRequest<ServerListResponse<Activity>>("/activities")
  ]);

  const deals = dealsPayload.rows ?? [];
  const tasks = tasksPayload.rows ?? [];
  const activities = activitiesPayload.rows ?? [];

  const openDeals = deals.filter((deal) => deal.status === "OPEN");
  const openTasks = tasks.filter((task) => task.status === "OPEN");
  const pipelineTotal = openDeals.reduce((sum, deal) => sum + deal.amount, 0);

  return (
    <main className="app-page">
      <header>
        <h1 className="page-title">{tr("Dashboard", "لوحة التحكم")}</h1>
        <p className="page-subtitle">{tr("A clear view of pipeline health, priorities, and daily progress.", "رؤية واضحة لصحة خط المبيعات والأولويات والتقدم اليومي.")}</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="metric-card">
          <p className="muted-label">{tr("Open deals", "الصفقات المفتوحة")}</p>
          <p className="mt-2 text-3xl font-semibold">{openDeals.length}</p>
        </article>
        <article className="metric-card">
          <p className="muted-label">{tr("Open tasks", "المهام المفتوحة")}</p>
          <p className="mt-2 text-3xl font-semibold">{openTasks.length}</p>
        </article>
        <article className="metric-card">
          <p className="muted-label">{tr("Pipeline total", "إجمالي خط المبيعات")}</p>
          <p className="mt-2 text-3xl font-semibold">${pipelineTotal.toLocaleString(locale)}</p>
        </article>
        <article className="metric-card">
          <p className="muted-label">{tr("Recent activity", "النشاط الأخير")}</p>
          <p className="mt-2 text-3xl font-semibold">{activities.length}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">{tr("Action queue", "قائمة الإجراءات")}</h2>
          <p className="mt-1 text-sm text-mutedfg">{tr("Focus on the highest-leverage work first.", "ركّز أولًا على الأعمال الأعلى تأثيرًا.")}</p>
          <div className="mt-4 space-y-2 text-sm">
            <Link href="/deals" className="block rounded-md border border-border px-3 py-2 hover:bg-muted">
              {tr("Review deals in active stages", "راجع الصفقات في المراحل النشطة")}
            </Link>
            <Link href="/tasks" className="block rounded-md border border-border px-3 py-2 hover:bg-muted">
              {tr("Clear overdue and today tasks", "أنهِ المهام المتأخرة ومهام اليوم")}
            </Link>
            <Link href="/contacts/new" className="block rounded-md border border-border px-3 py-2 hover:bg-muted">
              {tr("Add a new contact to pipeline", "أضف جهة اتصال جديدة إلى خط المبيعات")}
            </Link>
          </div>
        </article>

        <article className="panel p-4">
          <h2 className="text-sm font-semibold">{tr("System notes", "ملاحظات النظام")}</h2>
          <p className="mt-2 text-sm text-mutedfg">
            {tr(
              "Use this workspace as your daily operating system: capture context in contacts, keep deal stages current, and close each day with an updated task list.",
              "استخدم مساحة العمل كنظام تشغيل يومي: سجّل السياق داخل جهات الاتصال، وابقِ مراحل الصفقات محدثة، وأنهِ كل يوم بقائمة مهام محدثة."
            )}
          </p>
        </article>
      </section>
    </main>
  );
}
