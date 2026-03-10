import Link from "next/link";
import { Badge } from "@/components/Badge";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard, MetricGrid, PageHeader, SectionPanel } from "@/components/ui/workspace";
import type { Company, Contact, Deal, Invoice, Task } from "@/lib/crm-types";
import { invoiceStatusMeta, summarizeCurrencyTotals } from "@/lib/crm-presentation";
import { serverApiRequest, type ServerListResponse } from "@/lib/server-crm";
import { getDateLocale, getServerLanguage, pickByLanguage } from "@/lib/server-language";

export default async function CompaniesPage() {
  const language = await getServerLanguage();
  const locale = getDateLocale(language);
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);

  const [companiesPayload, contactsPayload, dealsPayload, invoicesPayload, tasksPayload] =
    await Promise.all([
      serverApiRequest<ServerListResponse<Company>>("/companies"),
      serverApiRequest<ServerListResponse<Contact>>("/contacts"),
      serverApiRequest<ServerListResponse<Deal>>("/deals"),
      serverApiRequest<ServerListResponse<Invoice>>("/invoices"),
      serverApiRequest<ServerListResponse<Task>>("/tasks"),
    ]);

  const companies = companiesPayload.rows ?? [];
  const contacts = contactsPayload.rows ?? [];
  const deals = dealsPayload.rows ?? [];
  const invoices = invoicesPayload.rows ?? [];
  const tasks = tasksPayload.rows ?? [];

  const companyRows = companies
    .map((company) => {
      const companyContacts = contacts.filter((contact) => contact.companyId === company.id);
      const openDeals = deals.filter(
        (deal) => deal.companyId === company.id && deal.status === "OPEN",
      );
      const outstandingInvoices = invoices.filter(
        (invoice) =>
          (invoice.companyId === company.id ||
            (invoice.relatedType === "company" && invoice.relatedId === company.id)) &&
          invoice.status !== "PAID" &&
          invoice.status !== "VOID",
      );
      const openTasks = tasks.filter(
        (task) =>
          task.relatedType === "company" && task.relatedId === company.id && task.status === "OPEN",
      );

      return {
        ...company,
        contactsCount: companyContacts.length,
        openDealsCount: openDeals.length,
        openTasksCount: openTasks.length,
        outstandingInvoices,
      };
    })
    .sort((a, b) => b.openDealsCount - a.openDealsCount || b.contactsCount - a.contactsCount);

  const activeAccounts = companyRows.filter((company) => company.openDealsCount > 0).length;
  const outstandingAccounts = companyRows.filter(
    (company) => company.outstandingInvoices.length > 0,
  ).length;
  const companiesNeedingContacts = companyRows.filter(
    (company) => company.contactsCount === 0,
  ).length;
  const priorityAccounts = companyRows
    .filter((company) => company.openDealsCount > 0 || company.outstandingInvoices.length > 0)
    .slice(0, 5);

  return (
    <main className="app-page">
      <PageHeader
        eyebrow={tr("Account workspace", "مساحة إدارة الحسابات")}
        title={tr("Companies", "الشركات")}
        description={tr(
          "The account list is structured around relationship density, pipeline exposure, billing pressure, and follow-up load.",
          "أصبحت قائمة الحسابات مبنية حول كثافة العلاقات والتعرّض لخط المبيعات وضغط الفوترة وحمل المتابعة.",
        )}
        actions={
          <Link href="/companies/new" className="btn btn-primary">
            {tr("New company", "شركة جديدة")}
          </Link>
        }
      />

      <MetricGrid>
        <MetricCard
          label={tr("Companies", "الشركات")}
          value={companies.length}
          hint={tr("Accounts in the workspace", "الحسابات داخل مساحة العمل")}
        />
        <MetricCard
          label={tr("Active accounts", "الحسابات النشطة")}
          value={activeAccounts}
          hint={tr("Accounts with open opportunities", "حسابات لديها فرص مفتوحة")}
          tone="accent"
        />
        <MetricCard
          label={tr("Billing attention", "تحتاج إلى متابعة مالية")}
          value={outstandingAccounts}
          hint={tr(
            "Accounts with unpaid or overdue invoices",
            "حسابات لديها فواتير غير مدفوعة أو متأخرة",
          )}
          tone={outstandingAccounts > 0 ? "warning" : "success"}
        />
        <MetricCard
          label={tr("Need contacts", "تحتاج إلى جهات اتصال")}
          value={companiesNeedingContacts}
          hint={tr("Accounts without mapped people", "حسابات بلا أشخاص مرتبطين")}
        />
      </MetricGrid>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_340px]">
        <SectionPanel
          title={tr("Account directory", "دليل الحسابات")}
          description={tr(
            "Scan industry, relationship depth, pipeline value, and billing posture in one table.",
            "افحص القطاع وعمق العلاقة وقيمة خط المبيعات ووضع الفوترة في جدول واحد.",
          )}
        >
          {companyRows.length === 0 ? (
            <EmptyState
              title={tr("No companies yet", "لا توجد شركات بعد")}
              hint={tr(
                "Create a company so contacts, opportunities, tasks, and invoices can connect back to a single account record.",
                "أنشئ شركة كي ترتبط جهات الاتصال والفرص والمهام والفواتير بحساب واحد.",
              )}
              action={
                <Link href="/companies/new" className="btn btn-primary">
                  {tr("Create company", "إنشاء شركة")}
                </Link>
              }
            />
          ) : (
            <DataTable
              rows={companyRows}
              columns={[
                {
                  key: "company",
                  label: tr("Company", "الشركة"),
                  render: (company) => (
                    <div className="space-y-1">
                      <Link
                        href={`/companies/${company.id}`}
                        className="font-medium text-fg hover:underline"
                      >
                        {company.name}
                      </Link>
                      <p className="text-xs text-mutedfg">
                        {company.industry ?? tr("No industry", "بدون قطاع")}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "domain",
                  label: tr("Domain", "النطاق"),
                  render: (company) => (
                    <span className="text-sm text-mutedfg">
                      {company.domain ?? tr("No domain", "بدون نطاق")}
                    </span>
                  ),
                },
                {
                  key: "coverage",
                  label: tr("Coverage", "التغطية"),
                  render: (company) => (
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="neutral">
                        {company.contactsCount} {tr("contacts", "جهات اتصال")}
                      </Badge>
                      <Badge tone={company.openTasksCount > 0 ? "warning" : "neutral"}>
                        {company.openTasksCount} {tr("tasks", "مهام")}
                      </Badge>
                    </div>
                  ),
                },
                {
                  key: "pipeline",
                  label: tr("Pipeline", "خط المبيعات"),
                  render: (company) => (
                    <div className="space-y-1">
                      <p className="font-medium text-fg">
                        {summarizeCurrencyTotals(
                          deals.filter(
                            (deal) => deal.companyId === company.id && deal.status === "OPEN",
                          ),
                          locale,
                          tr("No value", "بدون قيمة"),
                          (count) => tr(`${count} currencies`, `${count} عملات`),
                        )}
                      </p>
                      <p className="text-xs text-mutedfg">
                        {company.openDealsCount} {tr("open deals", "صفقات مفتوحة")}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "billing",
                  label: tr("Billing", "الفوترة"),
                  render: (company) =>
                    company.outstandingInvoices.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {company.outstandingInvoices.slice(0, 2).map((invoice) => {
                          const status = invoiceStatusMeta(invoice.status, tr);
                          return (
                            <Badge key={invoice.id} tone={status.tone}>
                              {status.label}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <Badge tone="success">{tr("Clear", "سليمة")}</Badge>
                    ),
                },
              ]}
              footer={tr(
                `${companyRows.length} companies in directory`,
                `${companyRows.length} شركة في الدليل`,
              )}
            />
          )}
        </SectionPanel>

        <div className="space-y-4">
          <SectionPanel
            title={tr("Account health", "صحة الحسابات")}
            description={tr(
              "Use this panel to spot data gaps before they become execution gaps.",
              "استخدم هذه اللوحة لاكتشاف فجوات البيانات قبل أن تصبح فجوات تنفيذية.",
            )}
          >
            <div className="space-y-3">
              <div className="rounded-2xl border border-border/85 bg-surface2/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mutedfg">
                  {tr("Without contacts", "بدون جهات اتصال")}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-fg">
                  {companiesNeedingContacts}
                </p>
              </div>
              <div className="rounded-2xl border border-border/85 bg-surface2/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mutedfg">
                  {tr("With open tasks", "مع مهام مفتوحة")}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-fg">
                  {companyRows.filter((company) => company.openTasksCount > 0).length}
                </p>
              </div>
              <div className="rounded-2xl border border-border/85 bg-surface2/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mutedfg">
                  {tr("With billing risk", "مع مخاطر فوترة")}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-fg">
                  {outstandingAccounts}
                </p>
              </div>
            </div>
          </SectionPanel>

          <SectionPanel
            title={tr("Priority accounts", "الحسابات ذات الأولوية")}
            description={tr(
              "Accounts carrying either revenue opportunity or billing pressure.",
              "الحسابات التي تحمل فرصة إيرادات أو ضغط فوترة.",
            )}
          >
            {priorityAccounts.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-surface2/70 px-4 py-4 text-sm text-mutedfg">
                {tr("No priority accounts surfaced yet.", "لم تظهر حسابات ذات أولوية بعد.")}
              </p>
            ) : (
              <div className="space-y-2">
                {priorityAccounts.map((company) => (
                  <Link
                    key={company.id}
                    href={`/companies/${company.id}`}
                    className="block rounded-2xl border border-border/85 bg-surface2/70 px-4 py-3 transition hover:border-fg/12 hover:bg-surface"
                  >
                    <p className="text-sm font-medium text-fg">{company.name}</p>
                    <p className="mt-1 text-xs text-mutedfg">
                      {company.openDealsCount} {tr("open deals", "صفقات مفتوحة")} ·{" "}
                      {company.outstandingInvoices.length}{" "}
                      {tr("outstanding invoices", "فواتير مستحقة")}
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
