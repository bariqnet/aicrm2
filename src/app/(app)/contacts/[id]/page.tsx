import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { AddNoteForm } from "@/components/AddNoteForm";
import type { Activity, Company, Contact, Deal, Invoice, Note, Task } from "@/lib/crm-types";
import { serverApiRequest, serverApiRequestOrNull, type ServerListResponse } from "@/lib/server-crm";
import { fmtMoney } from "@/lib/utils";

function fmtDateTime(value?: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await serverApiRequestOrNull<Contact>(`/contacts/${id}`);
  if (!contact) notFound();

  const [tasksPayload, notesPayload, activityPayload, dealsPayload, invoicesPayload, company] = await Promise.all([
    serverApiRequest<ServerListResponse<Task>>("/tasks", {
      query: { relatedType: "contact", relatedId: id }
    }),
    serverApiRequest<ServerListResponse<Note>>("/notes", {
      query: { relatedType: "contact", relatedId: id }
    }),
    serverApiRequest<ServerListResponse<Activity>>("/activities", {
      query: { entityType: "contact", entityId: id }
    }),
    serverApiRequest<ServerListResponse<Deal>>("/deals", {
      query: { primaryContactId: id }
    }),
    serverApiRequest<ServerListResponse<Invoice>>("/invoices"),
    contact.companyId ? serverApiRequestOrNull<Company>(`/companies/${contact.companyId}`) : Promise.resolve(null)
  ]);

  const tasks = (tasksPayload.rows ?? []).filter((task) => task.relatedType === "contact" && task.relatedId === id);
  const notes = (notesPayload.rows ?? [])
    .filter((note) => note.relatedType === "contact" && note.relatedId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const activity = (activityPayload.rows ?? [])
    .filter((entry) => entry.entityType === "contact" && entry.entityId === id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const deals = (dealsPayload.rows ?? []).filter((deal) => deal.primaryContactId === id);
  const invoices = (invoicesPayload.rows ?? []).filter(
    (invoice) =>
      invoice.contactId === id ||
      (invoice.relatedType === "contact" && invoice.relatedId === id)
  );

  return (
    <main className="app-page">
      <header className="space-y-2">
        <Link href="/contacts" className="text-sm text-mutedfg hover:text-fg">← Back to contacts</Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="page-title">Contact profile</h1>
            <p className="page-subtitle">View related work, notes, invoices, and activity in one place.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/invoices/new?relatedType=contact&relatedId=${id}`} className="btn">New invoice</Link>
            <Link href={`/contacts/${id}/edit`} className="btn btn-primary">Edit contact</Link>
          </div>
        </div>
      </header>

      <section className="panel p-4">
        <p className="text-lg font-semibold">{contact.firstName} {contact.lastName}</p>
        <p className="mt-1 text-sm text-mutedfg">{contact.jobTitle ?? "No title"}</p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <p>Email: <span className="text-mutedfg">{contact.email ?? "-"}</span></p>
          <p>Phone: <span className="text-mutedfg">{contact.phone ?? "-"}</span></p>
          <p>
            Company:{" "}
            {company ? (
              <Link href={`/companies/${company.id}`} className="text-accent hover:underline">{company.name}</Link>
            ) : (
              <span className="text-mutedfg">-</span>
            )}
          </p>
          <p>Created: <span className="text-mutedfg">{fmtDateTime(contact.createdAt)}</span></p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">Tasks</h2>
          {tasks.length === 0 ? (
            <p className="mt-2 text-sm text-mutedfg">No related tasks.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {tasks.map((task) => (
                <li key={task.id} className="rounded-md border border-border bg-surface2 px-3 py-2 text-sm">
                  <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                    {task.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-mutedfg">{task.status} · Due {fmtDateTime(task.dueAt)}</p>
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
            <p className="mt-2 text-sm text-mutedfg">No invoices linked to this contact.</p>
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
            <AddNoteForm relatedType="contact" relatedId={id} />
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
