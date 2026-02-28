import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getContactRecord,
  listActivitiesByEntity,
  listNotesByRelation,
  listTasksByRelation
} from "@/lib/mock-db";
import { getRequestContext } from "@/lib/request-context";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getRequestContext();
  const contact = getContactRecord(ctx, id);
  if (!contact) notFound();

  const tasks = listTasksByRelation(ctx, "contact", id);
  const notes = listNotesByRelation(ctx, "contact", id);
  const activity = listActivitiesByEntity(ctx, "contact", id);

  return (
    <main className="app-page">
      <header className="space-y-2">
        <Link href="/contacts" className="text-sm text-mutedfg hover:text-fg">← Back to contacts</Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="page-title">Contact profile</h1>
            <p className="page-subtitle">View related work, notes, invoices, and activity in one place.</p>
          </div>
          <Link href={`/contacts/${id}/edit`} className="btn">Edit contact</Link>
        </div>
      </header>

      <section className="panel p-4">
        <p className="text-lg font-semibold">{contact.firstName} {contact.lastName}</p>
        <p className="mt-1 text-sm text-mutedfg">{contact.jobTitle ?? "No title"}</p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <p>Email: <span className="text-mutedfg">{contact.email ?? "-"}</span></p>
          <p>Phone: <span className="text-mutedfg">{contact.phone ?? "-"}</span></p>
          <p>Company ID: <span className="font-mono text-xs text-mutedfg">{contact.companyId ?? "-"}</span></p>
          <p>Created: <span className="text-mutedfg">{new Date(contact.createdAt).toLocaleString()}</span></p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">Activity</h2>
          <p className="mt-2 text-sm text-mutedfg">{activity.length} events</p>
        </article>
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">Notes</h2>
          <p className="mt-2 text-sm text-mutedfg">{notes.length} notes</p>
        </article>
        <article className="panel p-4 md:col-span-2">
          <h2 className="text-sm font-semibold">Tasks</h2>
          {tasks.length === 0 ? (
            <p className="mt-2 text-sm text-mutedfg">No related tasks.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {tasks.map((task) => (
                <li key={task.id} className="rounded-md border border-border bg-surface2 px-3 py-2 text-sm">
                  <Link href={`/tasks/${task.id}`} className="hover:underline">
                    {task.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
