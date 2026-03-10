import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/Badge";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard, MetricGrid, PageHeader, SectionPanel } from "@/components/ui/workspace";
import type { Company, Contact, Deal, Task } from "@/lib/crm-types";
import { formatDateLabel } from "@/lib/crm-presentation";
import { serverApiRequest, SessionInvalidError, type ServerListResponse } from "@/lib/server-crm";
import { getDateLocale, getServerLanguage, pickByLanguage } from "@/lib/server-language";

export default async function ContactsPage() {
  const language = await getServerLanguage();
  const locale = getDateLocale(language);
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);

  let contactsPayload: ServerListResponse<Contact>;
  let companiesPayload: ServerListResponse<Company>;
  let dealsPayload: ServerListResponse<Deal>;
  let tasksPayload: ServerListResponse<Task>;

  try {
    [contactsPayload, companiesPayload, dealsPayload, tasksPayload] = await Promise.all([
      serverApiRequest<ServerListResponse<Contact>>("/contacts"),
      serverApiRequest<ServerListResponse<Company>>("/companies"),
      serverApiRequest<ServerListResponse<Deal>>("/deals"),
      serverApiRequest<ServerListResponse<Task>>("/tasks"),
    ]);
  } catch (error) {
    if (error instanceof SessionInvalidError) {
      redirect("/auth/sign-in?expired=1&next=/contacts");
    }
    throw error;
  }

  const contacts = contactsPayload.rows ?? [];
  const companies = companiesPayload.rows ?? [];
  const deals = dealsPayload.rows ?? [];
  const tasks = tasksPayload.rows ?? [];
  const companiesById = new Map(companies.map((company) => [company.id, company] as const));

  const contactRows = contacts
    .map((contact) => {
      const company = contact.companyId ? (companiesById.get(contact.companyId) ?? null) : null;
      const openDeals = deals.filter(
        (deal) => deal.primaryContactId === contact.id && deal.status === "OPEN",
      );
      const openTasks = tasks.filter(
        (task) =>
          task.relatedType === "contact" && task.relatedId === contact.id && task.status === "OPEN",
      );

      return {
        ...contact,
        company,
        openDealsCount: openDeals.length,
        openTasksCount: openTasks.length,
      };
    })
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const linkedContacts = contactRows.filter((contact) => contact.company).length;
  const activeContacts = contactRows.filter((contact) => contact.openDealsCount > 0).length;
  const needsEnrichment = contactRows.filter(
    (contact) => !contact.company || (!contact.email && !contact.phone),
  ).length;
  const unassignedContacts = contactRows.filter((contact) => !contact.company).slice(0, 5);

  return (
    <main className="app-page">
      <PageHeader
        eyebrow={tr("Relationship workspace", "مساحة إدارة العلاقات")}
        title={tr("Contacts", "جهات الاتصال")}
        description={tr(
          "The directory surfaces company context, active pipeline work, and execution load so teams can move from person to opportunity without switching mental models.",
          "يُظهر الدليل سياق الشركة والعمل الجاري في خط المبيعات وحمل التنفيذ كي تنتقل الفرق من الشخص إلى الفرصة دون تبديل النموذج الذهني.",
        )}
        actions={
          <>
            <Link href="/contacts/import" className="btn">
              {tr("Import CSV", "استيراد CSV")}
            </Link>
            <Link href="/contacts/new" className="btn btn-primary">
              {tr("New contact", "جهة اتصال جديدة")}
            </Link>
          </>
        }
      />

      <MetricGrid>
        <MetricCard
          label={tr("Contacts", "جهات الاتصال")}
          value={contacts.length}
          hint={tr("People mapped into your workspace", "أشخاص تم ربطهم داخل مساحة العمل")}
        />
        <MetricCard
          label={tr("Linked to companies", "مرتبطة بشركات")}
          value={linkedContacts}
          hint={tr("Structured account relationships", "علاقات حسابات منظمة")}
          tone="accent"
        />
        <MetricCard
          label={tr("Active in pipeline", "نشطة في خط المبيعات")}
          value={activeContacts}
          hint={tr("Contacts with open opportunities", "جهات اتصال لديها فرص مفتوحة")}
        />
        <MetricCard
          label={tr("Need enrichment", "تحتاج إلى استكمال")}
          value={needsEnrichment}
          hint={tr("Missing company or core reachability", "ينقصها شركة أو وسيلة تواصل أساسية")}
          tone={needsEnrichment > 0 ? "warning" : "success"}
        />
      </MetricGrid>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_340px]">
        <SectionPanel
          title={tr("Contact directory", "دليل جهات الاتصال")}
          description={tr(
            "A scan-friendly table for people, ownership context, and current workload.",
            "جدول سهل المسح للأشخاص وسياق الملكية وحمل العمل الحالي.",
          )}
        >
          {contactRows.length === 0 ? (
            <EmptyState
              title={tr("No contacts yet", "لا توجد جهات اتصال بعد")}
              hint={tr(
                "Start with a first contact so companies, deals, and tasks can link back to a real relationship.",
                "ابدأ بجهة الاتصال الأولى كي ترتبط الشركات والصفقات والمهام بعلاقة حقيقية.",
              )}
              action={
                <Link href="/contacts/new" className="btn btn-primary">
                  {tr("Create contact", "إنشاء جهة اتصال")}
                </Link>
              }
            />
          ) : (
            <DataTable
              rows={contactRows}
              columns={[
                {
                  key: "person",
                  label: tr("Person", "الشخص"),
                  render: (contact) => (
                    <div className="space-y-1">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="font-medium text-fg hover:underline"
                      >
                        {[contact.firstName, contact.lastName].filter(Boolean).join(" ")}
                      </Link>
                      <p className="text-xs text-mutedfg">
                        {contact.jobTitle ?? tr("No title", "بدون منصب")}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "company",
                  label: tr("Company", "الشركة"),
                  render: (contact) =>
                    contact.company ? (
                      <Link
                        href={`/companies/${contact.company.id}`}
                        className="text-sm text-fg hover:underline"
                      >
                        {contact.company.name}
                      </Link>
                    ) : (
                      <span className="text-sm text-mutedfg">{tr("Unassigned", "غير مرتبطة")}</span>
                    ),
                },
                {
                  key: "reach",
                  label: tr("Reach", "التواصل"),
                  render: (contact) => (
                    <div className="space-y-1 text-sm">
                      <p className="text-fg">{contact.email ?? tr("No email", "بدون بريد")}</p>
                      <p className="text-mutedfg">{contact.phone ?? tr("No phone", "بدون هاتف")}</p>
                    </div>
                  ),
                },
                {
                  key: "work",
                  label: tr("Open work", "العمل المفتوح"),
                  render: (contact) => (
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={contact.openDealsCount > 0 ? "info" : "neutral"}>
                        {contact.openDealsCount} {tr("deals", "صفقات")}
                      </Badge>
                      <Badge tone={contact.openTasksCount > 0 ? "warning" : "neutral"}>
                        {contact.openTasksCount} {tr("tasks", "مهام")}
                      </Badge>
                    </div>
                  ),
                },
                {
                  key: "added",
                  label: tr("Added", "أضيفت"),
                  render: (contact) => (
                    <span className="text-sm text-mutedfg">
                      {formatDateLabel(contact.createdAt, locale)}
                    </span>
                  ),
                },
              ]}
              footer={tr(
                `${contactRows.length} contacts in directory`,
                `${contactRows.length} جهة اتصال في الدليل`,
              )}
            />
          )}
        </SectionPanel>

        <div className="space-y-4">
          <SectionPanel
            title={tr("Lifecycle handoff", "انتقال دورة الحياة")}
            description={tr(
              "These counts expose where people are stalling between contact, account, and opportunity.",
              "تكشف هذه الأعداد أين تتعطل الجهات بين الاتصال والحساب والفرصة.",
            )}
          >
            <div className="space-y-3">
              <div className="rounded-2xl border border-border/85 bg-surface2/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mutedfg">
                  {tr("Without company", "بدون شركة")}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-fg">
                  {contactRows.length - linkedContacts}
                </p>
              </div>
              <div className="rounded-2xl border border-border/85 bg-surface2/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mutedfg">
                  {tr("With active deals", "مع صفقات نشطة")}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-fg">
                  {activeContacts}
                </p>
              </div>
              <div className="rounded-2xl border border-border/85 bg-surface2/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mutedfg">
                  {tr("With open tasks", "مع مهام مفتوحة")}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-fg">
                  {contactRows.filter((contact) => contact.openTasksCount > 0).length}
                </p>
              </div>
            </div>
          </SectionPanel>

          <SectionPanel
            title={tr("Needs assignment", "تحتاج إلى ربط")}
            description={tr(
              "Contacts that should be connected to a company before more work accumulates.",
              "جهات الاتصال التي يجب ربطها بشركة قبل تراكم مزيد من العمل.",
            )}
          >
            {unassignedContacts.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-surface2/70 px-4 py-4 text-sm text-mutedfg">
                {tr(
                  "Every recent contact has an account mapping.",
                  "كل جهة اتصال حديثة مرتبطة بحساب.",
                )}
              </p>
            ) : (
              <div className="space-y-2">
                {unassignedContacts.map((contact) => (
                  <Link
                    key={contact.id}
                    href={`/contacts/${contact.id}`}
                    className="block rounded-2xl border border-border/85 bg-surface2/70 px-4 py-3 transition hover:border-fg/12 hover:bg-surface"
                  >
                    <p className="text-sm font-medium text-fg">
                      {[contact.firstName, contact.lastName].filter(Boolean).join(" ")}
                    </p>
                    <p className="mt-1 text-xs text-mutedfg">
                      {contact.email ?? contact.phone ?? contact.id}
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
