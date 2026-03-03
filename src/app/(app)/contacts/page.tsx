import Link from "next/link";
import type { Contact } from "@/lib/crm-types";
import { serverApiRequest, type ServerListResponse } from "@/lib/server-crm";
import { getServerLanguage, pickByLanguage } from "@/lib/server-language";

export default async function ContactsPage() {
  const language = await getServerLanguage();
  const tr = (english: string, arabic: string) => pickByLanguage(language, english, arabic);

  const payload = await serverApiRequest<ServerListResponse<Contact>>("/contacts");
  const contacts = payload.rows ?? [];

  return (
    <main className="app-page">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">{tr("Contacts", "جهات الاتصال")}</h1>
          <p className="page-subtitle">{tr("Every person in your pipeline, organized for quick action.", "كل شخص في خط المبيعات لديك، مرتب لاتخاذ إجراء سريع.")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/contacts/import" className="btn">{tr("Import CSV", "استيراد CSV")}</Link>
          <Link href="/contacts/new" className="btn btn-primary">{tr("New contact", "جهة اتصال جديدة")}</Link>
        </div>
      </header>

      {contacts.length === 0 ? (
        <p className="panel panel-dashed p-10 text-sm text-mutedfg">{tr("No contacts yet. Create your first contact.", "لا توجد جهات اتصال بعد. أنشئ أول جهة اتصال.")}</p>
      ) : (
        <div className="table-shell overflow-x-auto">
          <table className="min-w-[700px] w-full text-left text-sm">
            <thead className="border-b border-border bg-surface2 text-xs uppercase tracking-[0.1em] text-mutedfg">
              <tr>
                <th className="px-4 py-3">{tr("Name", "الاسم")}</th>
                <th className="px-4 py-3">{tr("Email", "البريد الإلكتروني")}</th>
                <th className="px-4 py-3">{tr("Phone", "الهاتف")}</th>
                <th className="px-4 py-3">{tr("Actions", "الإجراءات")}</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-b border-border last:border-b-0 hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{contact.firstName} {contact.lastName}</td>
                  <td className="px-4 py-3 text-mutedfg">{contact.email ?? "-"}</td>
                  <td className="px-4 py-3 text-mutedfg">{contact.phone ?? "-"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/contacts/${contact.id}`} className="text-accent hover:underline">{tr("Open", "فتح")}</Link>
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
