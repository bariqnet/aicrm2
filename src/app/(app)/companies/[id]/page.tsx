import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCompanyRecord,
  listActivitiesByEntity,
  listContacts,
  listDeals
} from "@/lib/mock-db";
import { getRequestContext } from "@/lib/request-context";

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getRequestContext();
  const company = getCompanyRecord(ctx, id);
  if (!company) notFound();

  const contacts = listContacts(ctx).filter((contact) => contact.companyId === id);
  const deals = listDeals(ctx).filter((deal) => deal.companyId === id);
  const activity = listActivitiesByEntity(ctx, "company", id);

  return (
    <main className="app-page">
      <header className="space-y-2">
        <Link href="/companies" className="text-sm text-mutedfg hover:text-fg">← Back to companies</Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="page-title">Company profile</h1>
            <p className="page-subtitle">Account context, contacts, deals, and billing touchpoints.</p>
          </div>
          <Link href={`/companies/${id}/edit`} className="btn">Edit company</Link>
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
          <p className="mt-2 text-sm text-mutedfg">{contacts.length} linked contacts</p>
        </article>
        <article className="panel p-4">
          <h2 className="text-sm font-semibold">Deals</h2>
          <p className="mt-2 text-sm text-mutedfg">{deals.length} linked deals</p>
        </article>
        <article className="panel p-4 md:col-span-2">
          <h2 className="text-sm font-semibold">Activity</h2>
          <p className="mt-2 text-sm text-mutedfg">{activity.length} events</p>
        </article>
      </section>
    </main>
  );
}
