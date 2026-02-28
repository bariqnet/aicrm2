import { NextResponse } from "next/server";
import { validateBody } from "@/lib/http";
import { contactSchema } from "@/lib/validators";
import { createContactRecord, listContacts, logActivity } from "@/lib/mock-db";
import { getRequestContext } from "@/lib/request-context";

export async function GET(request: Request) {
  const ctx = await getRequestContext(request);
  const query = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
  const rows = listContacts(ctx).filter((contact) => {
    if (!query) return true;
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    return (
      fullName.includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      false
    );
  });
  return NextResponse.json({ rows, total: rows.length });
}

export async function POST(request: Request) {
  const validation = await validateBody(request, contactSchema);
  if (!validation.ok) return validation.response;

  const ctx = await getRequestContext(request);
  const contact = createContactRecord(ctx, validation.data);
  logActivity(ctx, { type: "contact.created", entityType: "contact", entityId: contact.id });

  return NextResponse.json(contact, { status: 201 });
}
