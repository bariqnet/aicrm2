import { NextResponse } from "next/server";
import { errorResponse, validateBody } from "@/lib/http";
import { stageSchema } from "@/lib/validators";
import { createStageRecord, listStages } from "@/lib/mock-db";
import { getRequestContext } from "@/lib/request-context";

export async function GET() {
  const ctx = await getRequestContext();
  const rows = listStages(ctx);
  return NextResponse.json({ rows, total: rows.length });
}

export async function POST(request: Request) {
  const validation = await validateBody(request, stageSchema);
  if (!validation.ok) return validation.response;

  const ctx = await getRequestContext(request);
  if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
    return errorResponse("Only admins can create stages", 403);
  }

  const stage = createStageRecord(ctx, validation.data);
  return NextResponse.json(stage, { status: 201 });
}
