import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import type { Company, Contact, Invoice } from "@/lib/crm-types";
import { serverApiRequest, SessionInvalidError, type ServerListResponse } from "@/lib/server-crm";
import { getDateLocale, getServerLanguage, pickByLanguage } from "@/lib/server-language";
import { fmtMoney } from "@/lib/utils";

function fmtDate(value: string | null | undefined, locale: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(locale);
}

function statusClass(status: Invoice["status"]): string {
  if (status === "PAID") return "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300";
  if (status === "OVERDUE") return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300";
  if (status === "SENT") return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300";
  if (status === "PARTIALLY_PAID") return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
  if (status === "VOID") return "bg-zinc-100 text-zinc-700 dark:bg-zinc-700/30 dark:text-zinc-300";
  return "bg-surface2 text-mutedfg";
}

function statusLabel(status: Invoice["status"], tr: (english: string, arabic: string) => string): string {
  if (status === "DRAFT") return tr("Draft", "مسودة");
  if (status === "SENT") return tr("Sent", "مرسلة");
  if (status === "PARTIALLY_PAID") return tr("Partially paid", "مدفوعة جزئيًا");
  if (status === "PAID") return tr("Paid", "مدفوعة");
  if (status === "OVERDUE") return tr("Overdue", "متأخرة");
  if (status === "VOID") return tr("Void", "ملغاة");
  return status;
}

export default async function InvoicesPage() {
  const language = await getServerLanguage();
  const locale = getDateLocale(language);
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);

  let invoicesPayload: ServerListResponse<Invoice>;
  let contactsPayload: ServerListResponse<Contact>;
  let companiesPayload: ServerListResponse<Company>;

  try {
    [invoicesPayload, contactsPayload, companiesPayload] = await Promise.all([
      serverApiRequest<ServerListResponse<Invoice>>("/invoices"),
      serverApiRequest<ServerListResponse<Contact>>("/contacts"),
      serverApiRequest<ServerListResponse<Company>>("/companies")
    ]);
  } catch (error) {
    if (error instanceof SessionInvalidError) {
      redirect("/auth/sign-in?expired=1&next=/invoices");
    }
    throw error;
  }

  const invoices = [...(invoicesPayload.rows ?? [])].sort((a, b) => {
    const aDate = +(new Date(a.dueAt ?? a.createdAt ?? 0));
    const bDate = +(new Date(b.dueAt ?? b.createdAt ?? 0));
    return bDate - aDate;
  });

  const contactNameById = new Map((contactsPayload.rows ?? []).map((contact) => [contact.id, `${contact.firstName} ${contact.lastName}`.trim()]));
  const companyNameById = new Map((companiesPayload.rows ?? []).map((company) => [company.id, company.name]));

  const metrics = {
    draft: invoices.filter((invoice) => invoice.status === "DRAFT").length,
    sent: invoices.filter((invoice) => invoice.status === "SENT").length,
    partiallyPaid: invoices.filter((invoice) => invoice.status === "PARTIALLY_PAID").length,
    paid: invoices.filter((invoice) => invoice.status === "PAID").length,
    overdue: invoices.filter((invoice) => invoice.status === "OVERDUE").length,
    outstanding: invoices.filter((invoice) => invoice.status !== "PAID" && invoice.status !== "VOID").length
  };

  return (
    <main className="app-page">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">{tr("Invoices", "الفواتير")}</h1>
          <p className="page-subtitle">{tr("Track billing status from draft to paid.", "تابع حالة الفوترة من المسودة حتى السداد.")}</p>
        </div>
        <Link href="/invoices/new" className="btn btn-primary">{tr("New invoice", "فاتورة جديدة")}</Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <article className="metric-card">
          <p className="muted-label">{tr("Draft", "مسودة")}</p>
          <p className="mt-2 text-3xl font-semibold">{metrics.draft}</p>
        </article>
        <article className="metric-card">
          <p className="muted-label">{tr("Sent", "مرسلة")}</p>
          <p className="mt-2 text-3xl font-semibold">{metrics.sent}</p>
        </article>
        <article className="metric-card">
          <p className="muted-label">{tr("Partially paid", "مدفوعة جزئيًا")}</p>
          <p className="mt-2 text-3xl font-semibold">{metrics.partiallyPaid}</p>
        </article>
        <article className="metric-card">
          <p className="muted-label">{tr("Paid", "مدفوعة")}</p>
          <p className="mt-2 text-3xl font-semibold">{metrics.paid}</p>
        </article>
        <article className="metric-card">
          <p className="muted-label">{tr("Overdue", "متأخرة")}</p>
          <p className="mt-2 text-3xl font-semibold">{metrics.overdue}</p>
        </article>
        <article className="metric-card">
          <p className="muted-label">{tr("Outstanding", "مستحقة")}</p>
          <p className="mt-2 text-3xl font-semibold">{metrics.outstanding}</p>
        </article>
      </section>

      {invoices.length === 0 ? (
        <p className="panel panel-dashed p-8 text-sm text-mutedfg">{tr("No invoices created yet.", "لا توجد فواتير بعد.")}</p>
      ) : (
        <div className="table-shell overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="border-b border-border bg-surface2 text-xs uppercase tracking-[0.1em] text-mutedfg">
              <tr>
                <th className="px-4 py-3">{tr("Invoice", "الفاتورة")}</th>
                <th className="px-4 py-3">{tr("Related record", "السجل المرتبط")}</th>
                <th className="px-4 py-3">{tr("Amount", "المبلغ")}</th>
                <th className="px-4 py-3">{tr("Issued", "الإصدار")}</th>
                <th className="px-4 py-3">{tr("Due", "الاستحقاق")}</th>
                <th className="px-4 py-3">{tr("Status", "الحالة")}</th>
                <th className="px-4 py-3">{tr("Actions", "الإجراءات")}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const relatedType = invoice.relatedType;
                const relatedId = invoice.relatedId ?? invoice.contactId ?? invoice.companyId ?? null;
                const relatedName = relatedType === "contact"
                  ? contactNameById.get(relatedId ?? "")
                  : relatedType === "company"
                    ? companyNameById.get(relatedId ?? "")
                    : null;

                const relatedHref = relatedType === "contact"
                  ? relatedId ? `/contacts/${relatedId}` : null
                  : relatedType === "company"
                    ? relatedId ? `/companies/${relatedId}` : null
                    : null;

                return (
                  <tr key={invoice.id} className="border-b border-border last:border-b-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-mutedfg">{invoice.title}</p>
                    </td>
                    <td className="px-4 py-3 text-mutedfg">
                      {relatedType && relatedHref ? (
                        <Link href={relatedHref as Route} className="text-accent hover:underline">
                          {relatedName ?? `${relatedType === "contact" ? tr("Contact", "جهة اتصال") : tr("Company", "شركة")} ${relatedId}`}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">{fmtMoney(invoice.amount, invoice.currency)}</td>
                    <td className="px-4 py-3 text-mutedfg">{fmtDate(invoice.issuedAt, locale)}</td>
                    <td className="px-4 py-3 text-mutedfg">{fmtDate(invoice.dueAt, locale)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(invoice.status)}`}>
                        {statusLabel(invoice.status, tr)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link href={`/invoices/${invoice.id}` as Route} className="text-accent hover:underline">{tr("Open", "فتح")}</Link>
                        <Link href={`/invoices/${invoice.id}/edit` as Route} className="text-accent hover:underline">{tr("Edit", "تعديل")}</Link>
                        <a href={`/print/invoices/${invoice.id}?autoprint=1`} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                          {tr("Print", "طباعة")}
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
