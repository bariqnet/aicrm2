import { NextResponse } from "next/server";
import { validateBody } from "@/lib/http";
import { companySchema } from "@/lib/validators";
import { createCompanyRecord, listCompanies, logActivity } from "@/lib/mock-db";
import { getRequestContext } from "@/lib/request-context";

export async function GET(request: Request) {
  const ctx = await getRequestContext(request);
  const query = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
  const rows = listCompanies(ctx).filter((company) => {
    if (!query) return true;
    return (
      company.name.toLowerCase().includes(query) ||
      company.domain?.toLowerCase().includes(query) ||
      false
    );
  });
  return NextResponse.json({ rows, total: rows.length });
}

export async function POST(request: Request) {
  const validation = await validateBody(request, companySchema);
  if (!validation.ok) return validation.response;

  const ctx = await getRequestContext(request);
  const company = createCompanyRecord(ctx, validation.data);
  logActivity(ctx, { type: "company.created", entityType: "company", entityId: company.id });

  return NextResponse.json(company, { status: 201 });
}
