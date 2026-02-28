import Link from "next/link";
import { listContacts } from "@/lib/mock-db";
import { getRequestContext } from "@/lib/request-context";

export default async function ContactsPage() {
  const ctx = await getRequestContext();
  const contacts = listContacts(ctx);

  return (
    <main className="app-page">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-subtitle">Every person in your pipeline, organized for quick action.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/contacts/import" className="btn">Import CSV</Link>
          <Link href="/contacts/new" className="btn btn-primary">New contact</Link>
        </div>
      </header>

      {contacts.length === 0 ? (
        <p className="panel panel-dashed p-10 text-sm text-mutedfg">No contacts yet. Create your first contact.</p>
      ) : (
        <div className="table-shell">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface2 text-xs uppercase tracking-[0.1em] text-mutedfg">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-b border-border last:border-b-0 hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{contact.firstName} {contact.lastName}</td>
                  <td className="px-4 py-3 text-mutedfg">{contact.email ?? "-"}</td>
                  <td className="px-4 py-3 text-mutedfg">{contact.phone ?? "-"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/contacts/${contact.id}`} className="text-accent hover:underline">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
