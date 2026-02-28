import { NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { listActivities } from "@/lib/mock-db";

export async function GET() {
  const ctx = await getRequestContext();
  const rows = listActivities(ctx);
  return NextResponse.json({ rows, total: rows.length });
}
