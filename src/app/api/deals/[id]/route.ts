import { NextResponse } from "next/server";
import { errorResponse, validateBody } from "@/lib/http";
import { dealPatchSchema } from "@/lib/validators";
import { getRequestContext } from "@/lib/request-context";
import {
  deleteDealRecord,
  getDealRecord,
  listDeals,
  logActivity,
  updateDealRecord
} from "@/lib/mock-db";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getRequestContext(request);
  const { id } = await context.params;
  const deal = getDealRecord(ctx, id);
  if (!deal) return errorResponse("Deal not found", 404);
  return NextResponse.json(deal);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const validation = await validateBody(request, dealPatchSchema);
  if (!validation.ok) return validation.response;

  const ctx = await getRequestContext(request);
  const { id } = await context.params;
  const before = listDeals(ctx).find((deal) => deal.id === id);
  const updated = updateDealRecord(ctx, id, validation.data);

  if (!updated) return errorResponse("Deal not found", 404);

  if (before && validation.data.stageId && before.stageId !== updated.stageId) {
    logActivity(ctx, {
      type: "deal.stage_changed",
      entityType: "deal",
      entityId: updated.id,
      metadata: { fromStageId: before.stageId, toStageId: updated.stageId }
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getRequestContext(request);
  const { id } = await context.params;
  const deleted = deleteDealRecord(ctx, id);
  if (!deleted) return errorResponse("Deal not found", 404);
  return NextResponse.json({ ok: true });
}
