import Link from "next/link";
import { notFound } from "next/navigation";
import type { Activity, Company, Contact, Invoice } from "@/lib/crm-types";
import { serverApiRequest, serverApiRequestOrNull, type ServerListResponse } from "@/lib/server-crm";
import { fmtMoney } from "@/lib/utils";

function fmtDateTime(value?: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function statusClass(status: Invoice["status"]): string {
  if (status === "PAID") return "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300";
  if (status === "OVERDUE") return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300";
  if (status === "SENT") return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300";
  if (status === "PARTIALLY_PAID") return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
  if (status === "VOID") return "bg-zinc-100 text-zinc-700 dark:bg-zinc-700/30 dark:text-zinc-300";
  return "bg-surface2 text-mutedfg";
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await serverApiRequestOrNull<Invoice>(`/invoices/${id}`);
  if (!invoice) notFound();

  const [relatedContact, relatedCompany, activityPayload] = await Promise.all([
    invoice.relatedType === "contact" && invoice.relatedId
      ? serverApiRequestOrNull<Contact>(`/contacts/${invoice.relatedId}`)
      : invoice.contactId
        ? serverApiRequestOrNull<Contact>(`/contacts/${invoice.contactId}`)
        : Promise.resolve(null),
    invoice.relatedType === "company" && invoice.relatedId
      ? serverApiRequestOrNull<Company>(`/companies/${invoice.relatedId}`)
      : invoice.companyId
        ? serverApiRequestOrNull<Company>(`/companies/${invoice.companyId}`)
        : Promise.resolve(null),
    serverApiRequest<ServerListResponse<Activity>>("/activities", {
      query: { entityType: "invoice", entityId: id }
    })
  ]);

  const activity = (activityPayload.rows ?? [])
    .filter((entry) => entry.entityType === "invoice" && entry.entityId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <main className="app-page">
      <header className="space-y-2">
        <Link href="/invoices" className="text-sm text-mutedfg hover:text-fg">← Back to invoices</Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="page-title">Invoice detail</h1>
            <p className="page-subtitle">Billing context, status, and linked records.</p>
          </div>
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(invoice.status)}`}>
            {invoice.status}
          </span>
        </div>
      </header>

      <section className="panel p-4">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p>Invoice: <span className="font-medium">{invoice.invoiceNumber}</span></p>
          <p>Title: <span className="text-mutedfg">{invoice.title}</span></p>
          <p>Amount: <span className="text-mutedfg">{fmtMoney(invoice.amount, invoice.currency)}</span></p>
          <p>Issued: <span className="text-mutedfg">{fmtDateTime(invoice.issuedAt)}</span></p>
          <p>Due: <span className="text-mutedfg">{fmtDateTime(invoice.dueAt)}</span></p>
          <p>Paid: <span className="text-mutedfg">{fmtDateTime(invoice.paidAt)}</span></p>
          <p>
            Related contact:{" "}
            {relatedContact ? (
              <Link href={`/contacts/${relatedContact.id}`} className="text-accent hover:underline">
                {relatedContact.firstName} {relatedContact.lastName}
              </Link>
            ) : (
              <span className="text-mutedfg">-</span>
            )}
          </p>
          <p>
            Related company:{" "}
            {relatedCompany ? (
              <Link href={`/companies/${relatedCompany.id}`} className="text-accent hover:underline">
                {relatedCompany.name}
              </Link>
            ) : (
              <span className="text-mutedfg">-</span>
            )}
          </p>
        </div>
        {invoice.notes ? (
          <div className="mt-3 rounded-md border border-border bg-surface2 px-3 py-2 text-sm">
            <p className="muted-label">Notes</p>
            <p className="mt-1">{invoice.notes}</p>
          </div>
        ) : null}
      </section>

      <section className="panel p-4">
        <h2 className="text-sm font-semibold">Recent activity</h2>
        {activity.length === 0 ? (
          <p className="mt-2 text-sm text-mutedfg">No activity yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {activity.slice(0, 8).map((entry) => (
              <li key={entry.id} className="rounded-md border border-border bg-surface2 px-3 py-2 text-sm">
                <p className="font-medium">{entry.type}</p>
                <p className="text-xs text-mutedfg">{fmtDateTime(entry.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
