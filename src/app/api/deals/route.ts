import { NextResponse } from "next/server";
import { validateBody } from "@/lib/http";
import { dealSchema } from "@/lib/validators";
import { createDealRecord, listDeals, logActivity } from "@/lib/mock-db";
import { getRequestContext } from "@/lib/request-context";

export async function GET(request: Request) {
  const ctx = await getRequestContext(request);
  const query = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
  const rows = listDeals(ctx).filter((deal) => {
    if (!query) return true;
    return (
      deal.title.toLowerCase().includes(query) ||
      deal.description?.toLowerCase().includes(query) ||
      false
    );
  });
  return NextResponse.json({ rows, total: rows.length });
}

export async function POST(request: Request) {
  const validation = await validateBody(request, dealSchema);
  if (!validation.ok) return validation.response;

  const ctx = await getRequestContext(request);
  const deal = createDealRecord(ctx, validation.data);
  logActivity(ctx, { type: "deal.created", entityType: "deal", entityId: deal.id });

  return NextResponse.json(deal, { status: 201 });
}
