import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { AddNoteForm } from "@/components/AddNoteForm";
import type { Activity, Company, Contact, Deal, Invoice, Note } from "@/lib/crm-types";
import { serverApiRequest, serverApiRequestOrNull, type ServerListResponse } from "@/lib/server-crm";
import { fmtMoney } from "@/lib/utils";

function fmtDateTime(value?: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await serverApiRequestOrNull<Company>(`/companies/${id}`);
  if (!company) notFound();

  const [contactsPayload, dealsPayload, notesPayload, activityPayload, invoicesPayload] = await Promise.all([
    serverApiRequest<ServerListResponse<Contact>>("/contacts", { query: { companyId: id } }),
    serverApiRequest<ServerListResponse<Deal>>("/deals", { query: { companyId: id } }),
    serverApiRequest<ServerListResponse<Note>>("/notes", {
      query: { relatedType: "company", relatedId: id }
    }),
    serverApiRequest<ServerListResponse<Activity>>("/activities", {
      query: { entityType: "company", entityId: id }
    }),
    serverApiRequest<ServerListResponse<Invoice>>("/invoices")
  ]);

  const contacts = (contactsPayload.rows ?? []).filter((contact) => contact.companyId === id);
  const deals = (dealsPayload.rows ?? []).filter((deal) => deal.companyId === id);
  const notes = (notesPayload.rows ?? [])
    .filter((note) => note.relatedType === "company" && note.relatedId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const activity = (activityPayload.rows ?? [])
    .filter((entry) => entry.entityType === "company" && entry.entityId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const invoices = (invoicesPayload.rows ?? []).filter(
    (invoice) =>
      invoice.companyId === id ||
      (invoice.relatedType === "company" && invoice.relatedId === id)
  );

  return (
    <main className="app-page">
      <header className="space-y-2">
        <Link href="/companies" className="text-sm text-mutedfg hover:text-fg">← Back to companies</Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="page-title">Company profile</h1>
            <p className="page-subtitle">Account context, contacts, deals, and billing touchpoints.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/invoices/new?relatedType=company&relatedId=${id}`} className="btn">New invoice</Link>
            <Link href={`/companies/${id}/edit`} className="btn btn-primary">Edit company</Link>
          </div>
        </div>
      </header>

      <section className="panel p-4">
        <p className="text-lg font-semibold">{company.name}</p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <p>Industry: <span className="text-mutedfg">{company.industry ?? "-"}</span></p>
          <p>Domain: <span className="text-mutedfg">{company.domain ?? "-"}</span></p>
          <p>Size: <span className="text-mutedfg">{company.size ?? "-"}</span></p>
          <p>ID: <span className="font-mono text-xs text-mutedfg">{company.id}</span></p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">Contacts</h2>
          {contacts.length === 0 ? (
            <p className="mt-2 text-sm text-mutedfg">No linked contacts.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {contacts.map((contact) => (
                <li key={contact.id} className="rounded-md border border-border bg-surface2 px-3 py-2 text-sm">
                  <Link href={`/contacts/${contact.id}`} className="font-medium hover:underline">
                    {contact.firstName} {contact.lastName}
                  </Link>
                  <p className="mt-0.5 text-xs text-mutedfg">{contact.email ?? "No email"}</p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel p-4">
          <h2 className="text-sm font-semibold">Deals</h2>
          {deals.length === 0 ? (
            <p className="mt-2 text-sm text-mutedfg">No linked deals.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {deals.map((deal) => (
                <li key={deal.id} className="rounded-md border border-border bg-surface2 px-3 py-2 text-sm">
                  <Link href={`/deals/${deal.id}`} className="font-medium hover:underline">
                    {deal.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-mutedfg">
                    {deal.status} · {fmtMoney(deal.amount, deal.currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel p-4">
          <h2 className="text-sm font-semibold">Invoices</h2>
          {invoices.length === 0 ? (
            <p className="mt-2 text-sm text-mutedfg">No invoices linked to this company.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {invoices.map((invoice) => (
                <li key={invoice.id} className="rounded-md border border-border bg-surface2 px-3 py-2 text-sm">
                  <Link href={`/invoices/${invoice.id}` as Route} className="font-medium hover:underline">
                    {invoice.invoiceNumber} · {invoice.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-mutedfg">
                    {invoice.status} · {fmtMoney(invoice.amount, invoice.currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel p-4">
          <h2 className="text-sm font-semibold">Notes</h2>
          <div className="mt-3">
            <AddNoteForm relatedType="company" relatedId={id} />
          </div>
          {notes.length === 0 ? (
            <p className="mt-2 text-sm text-mutedfg">No notes yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {notes.map((note) => (
                <li key={note.id} className="rounded-md border border-border bg-surface2 px-3 py-2 text-sm">
                  <p>{note.body}</p>
                  <p className="mt-1 text-xs text-mutedfg">{fmtDateTime(note.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel p-4 md:col-span-2">
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
        </article>
      </section>
    </main>
  );
}
