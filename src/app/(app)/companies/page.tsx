import Link from "next/link";
import { listCompanies } from "@/lib/mock-db";
import { getRequestContext } from "@/lib/request-context";

export default async function CompaniesPage() {
  const ctx = await getRequestContext();
  const companies = listCompanies(ctx);

  return (
    <main className="app-page">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="page-subtitle">Account records with industry and ownership context.</p>
        </div>
        <Link href="/companies/new" className="btn btn-primary">New company</Link>
      </header>

      {companies.length === 0 ? (
        <p className="panel panel-dashed p-10 text-sm text-mutedfg">No companies yet.</p>
      ) : (
        <div className="table-shell">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface2 text-xs uppercase tracking-[0.1em] text-mutedfg">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Industry</th>
                <th className="px-4 py-3">Domain</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-b border-border last:border-b-0 hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{company.name}</td>
                  <td className="px-4 py-3 text-mutedfg">{company.industry ?? "-"}</td>
                  <td className="px-4 py-3 text-mutedfg">{company.domain ?? "-"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/companies/${company.id}`} className="text-accent hover:underline">Open</Link>
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
