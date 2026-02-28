import { NextResponse } from "next/server";
import { errorResponse, validateBody } from "@/lib/http";
import { contactSchema } from "@/lib/validators";
import { getRequestContext } from "@/lib/request-context";
import {
  deleteContactRecord,
  getContactRecord,
  updateContactRecord
} from "@/lib/mock-db";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getRequestContext(request);
  const { id } = await context.params;
  const contact = getContactRecord(ctx, id);
  if (!contact) return errorResponse("Contact not found", 404);
  return NextResponse.json(contact);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const validation = await validateBody(request, contactSchema);
  if (!validation.ok) return validation.response;

  const ctx = await getRequestContext(request);
  const { id } = await context.params;
  const updated = updateContactRecord(ctx, id, validation.data);

  if (!updated) return errorResponse("Contact not found", 404);
  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getRequestContext(request);
  const { id } = await context.params;
  const deleted = deleteContactRecord(ctx, id);
  if (!deleted) return errorResponse("Contact not found", 404);
  return NextResponse.json({ ok: true });
}
