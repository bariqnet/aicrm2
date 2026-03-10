import Link from "next/link";
import { Badge } from "@/components/Badge";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard, MetricGrid, PageHeader, SectionPanel } from "@/components/ui/workspace";
import type { Company, Contact, Deal, Stage, Task } from "@/lib/crm-types";
import { formatDateLabel } from "@/lib/crm-presentation";
import { serverApiRequest, type ServerListResponse } from "@/lib/server-crm";
import { getDateLocale, getServerLanguage, pickByLanguage } from "@/lib/server-language";

export default async function LeadsPage() {
  const language = await getServerLanguage();
  const locale = getDateLocale(language);
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);

  const [contactsPayload, companiesPayload, dealsPayload, stagesPayload, tasksPayload] =
    await Promise.all([
      serverApiRequest<ServerListResponse<Contact>>("/contacts"),
      serverApiRequest<ServerListResponse<Company>>("/companies"),
      serverApiRequest<ServerListResponse<Deal>>("/deals"),
      serverApiRequest<ServerListResponse<Stage>>("/stages"),
      serverApiRequest<ServerListResponse<Task>>("/tasks"),
    ]);

  const contacts = contactsPayload.rows ?? [];
  const companiesById = new Map(
    (companiesPayload.rows ?? []).map((company) => [company.id, company] as const),
  );
  const stages = [...(stagesPayload.rows ?? [])].sort((a, b) => a.order - b.order);
  const earlyStageIds = new Set(stages.slice(0, 2).map((stage) => stage.id));
  const deals = dealsPayload.rows ?? [];
  const tasks = tasksPayload.rows ?? [];

  const leadRows = contacts
    .map((contact) => {
      const company = contact.companyId ? (companiesById.get(contact.companyId) ?? null) : null;
      const relatedDeals = deals.filter(
        (deal) => deal.primaryContactId === contact.id && deal.status === "OPEN",
      );
      const earlyStageDeal = relatedDeals.find((deal) => earlyStageIds.has(deal.stageId)) ?? null;
      const openTasks = tasks.filter(
        (task) =>
          task.relatedType === "contact" && task.relatedId === contact.id && task.status === "OPEN",
      );

      const lifecycleStatus = !company
        ? tr("Needs account mapping", "تحتاج إلى ربط بحساب")
        : relatedDeals.length === 0
          ? tr("Ready for qualification", "جاهزة للتأهيل")
          : earlyStageDeal
            ? tr("In qualification", "ضمن التأهيل")
            : tr("Converted downstream", "تم تحويلها لاحقًا");

      return {
        ...contact,
        company,
        lifecycleStatus,
        openTasksCount: openTasks.length,
        relatedDealsCount: relatedDeals.length,
        earlyStageDeal,
      };
    })
    .filter(
      (contact) =>
        !contact.company || contact.relatedDealsCount === 0 || Boolean(contact.earlyStageDeal),
    )
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const needsAccount = leadRows.filter((lead) => !lead.company).length;
  const readyForQualification = leadRows.filter(
    (lead) => lead.company && lead.relatedDealsCount === 0,
  ).length;
  const inQualification = leadRows.filter((lead) => Boolean(lead.earlyStageDeal)).length;
  const hottestLeads = leadRows.filter((lead) => lead.openTasksCount > 0).slice(0, 5);

  return (
    <main className="app-page">
      <PageHeader
        eyebrow={tr("Top-of-funnel workspace", "مساحة قمة القمع")}
        title={tr("Leads", "العملاء المحتملون")}
        description={tr(
          "Because the current data model has no separate lead entity, this view derives top-of-funnel work from contacts, early-stage opportunities, and qualification tasks.",
          "لأن نموذج البيانات الحالي لا يحتوي على كيان مستقل للعملاء المحتملين، فإن هذا العرض يستنتج عمل قمة القمع من جهات الاتصال والفرص المبكرة ومهام التأهيل.",
        )}
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

      <MetricGrid>
        <MetricCard
          label={tr("Lead queue", "قائمة العملاء المحتملين")}
          value={leadRows.length}
          hint={tr("Derived qualification records", "سجلات تأهيل مشتقة")}
        />
        <MetricCard
          label={tr("Need account", "تحتاج إلى حساب")}
          value={needsAccount}
          hint={tr("Contacts without company mapping", "جهات اتصال بلا شركة مرتبطة")}
          tone={needsAccount > 0 ? "warning" : "success"}
        />
        <MetricCard
          label={tr("Ready for qualification", "جاهزة للتأهيل")}
          value={readyForQualification}
          hint={tr("Contacts ready for first opportunity", "جهات اتصال جاهزة لأول فرصة")}
          tone="accent"
        />
        <MetricCard
          label={tr("In qualification", "ضمن التأهيل")}
          value={inQualification}
          hint={tr("Leads already inside early-stage deals", "عملاء محتملون ضمن صفقات مبكرة")}
        />
      </MetricGrid>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <SectionPanel
          title={tr("Qualification queue", "قائمة التأهيل")}
          description={tr(
            "This table exposes who still needs a company, who is ready for a deal, and who is already in early-stage qualification.",
            "يكشف هذا الجدول من ما زال يحتاج إلى شركة ومن هو جاهز لصفقة ومن دخل بالفعل في تأهيل مبكر.",
          )}
        >
          {leadRows.length === 0 ? (
            <EmptyState
              title={tr("No leads surfaced", "لم تظهر أي جهات محتملة")}
              hint={tr(
                "The top-of-funnel queue is clear. Add new contacts or create early-stage opportunities to restart qualification work.",
                "قائمة قمة القمع فارغة. أضف جهات اتصال جديدة أو أنشئ فرصًا مبكرة لإعادة تشغيل عمل التأهيل.",
              )}
            />
          ) : (
            <DataTable
              rows={leadRows}
              columns={[
                {
                  key: "lead",
                  label: tr("Lead", "العميل المحتمل"),
                  render: (lead) => (
                    <div className="space-y-1">
                      <Link
                        href={`/contacts/${lead.id}`}
                        className="font-medium text-fg hover:underline"
                      >
                        {[lead.firstName, lead.lastName].filter(Boolean).join(" ")}
                      </Link>
                      <p className="text-xs text-mutedfg">{lead.email ?? lead.phone ?? lead.id}</p>
                    </div>
                  ),
                },
                {
                  key: "company",
                  label: tr("Company", "الشركة"),
                  render: (lead) =>
                    lead.company ? (
                      <Link
                        href={`/companies/${lead.company.id}`}
                        className="text-sm text-fg hover:underline"
                      >
                        {lead.company.name}
                      </Link>
                    ) : (
                      <span className="text-sm text-mutedfg">{tr("Unassigned", "غير مرتبطة")}</span>
                    ),
                },
                {
                  key: "status",
                  label: tr("Qualification status", "حالة التأهيل"),
                  render: (lead) => (
                    <Badge
                      tone={lead.earlyStageDeal ? "info" : lead.company ? "success" : "warning"}
                    >
                      {lead.lifecycleStatus}
                    </Badge>
                  ),
                },
                {
                  key: "signals",
                  label: tr("Signals", "الإشارات"),
                  render: (lead) => (
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={lead.relatedDealsCount > 0 ? "info" : "neutral"}>
                        {lead.relatedDealsCount} {tr("open deals", "صفقات مفتوحة")}
                      </Badge>
                      <Badge tone={lead.openTasksCount > 0 ? "warning" : "neutral"}>
                        {lead.openTasksCount} {tr("tasks", "مهام")}
                      </Badge>
                    </div>
                  ),
                },
                {
                  key: "created",
                  label: tr("Added", "أضيفت"),
                  render: (lead) => formatDateLabel(lead.createdAt, locale),
                },
              ]}
              footer={tr(
                `${leadRows.length} leads in qualification view`,
                `${leadRows.length} عميلًا محتملًا في عرض التأهيل`,
              )}
            />
          )}
        </SectionPanel>

        <div className="space-y-4">
          <SectionPanel
            title={tr("Hot leads", "العملاء المحتملون الساخنون")}
            description={tr(
              "The most active lead records, based on open qualification tasks.",
              "أكثر السجلات نشاطًا بناءً على مهام التأهيل المفتوحة.",
            )}
          >
            {hottestLeads.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-surface2/70 px-4 py-4 text-sm text-mutedfg">
                {tr("No hot leads right now.", "لا توجد جهات محتملة ساخنة الآن.")}
              </p>
            ) : (
              <div className="space-y-2">
                {hottestLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/contacts/${lead.id}`}
                    className="block rounded-2xl border border-border/85 bg-surface2/70 px-4 py-3 transition hover:border-fg/12 hover:bg-surface"
                  >
                    <p className="text-sm font-medium text-fg">
                      {[lead.firstName, lead.lastName].filter(Boolean).join(" ")}
                    </p>
                    <p className="mt-1 text-xs text-mutedfg">
                      {lead.openTasksCount} {tr("open qualification tasks", "مهام تأهيل مفتوحة")}
                    </p>
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
