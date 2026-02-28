import { NextResponse } from "next/server";
import { errorResponse, validateBody } from "@/lib/http";
import { companySchema } from "@/lib/validators";
import { getRequestContext } from "@/lib/request-context";
import {
  deleteCompanyRecord,
  getCompanyRecord,
  updateCompanyRecord
} from "@/lib/mock-db";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getRequestContext(request);
  const { id } = await context.params;
  const company = getCompanyRecord(ctx, id);
  if (!company) return errorResponse("Company not found", 404);
  return NextResponse.json(company);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const validation = await validateBody(request, companySchema);
  if (!validation.ok) return validation.response;

  const { id } = await context.params;
  const ctx = await getRequestContext(request);
  const updated = updateCompanyRecord(ctx, id, validation.data);

  if (!updated) return errorResponse("Company not found", 404);
  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getRequestContext(request);
  const { id } = await context.params;
  const deleted = deleteCompanyRecord(ctx, id);
  if (!deleted) return errorResponse("Company not found", 404);
  return NextResponse.json({ ok: true });
}
