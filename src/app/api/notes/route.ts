import { NextResponse } from "next/server";
import { validateBody } from "@/lib/http";
import { noteSchema } from "@/lib/validators";
import { createNoteRecord, logActivity } from "@/lib/mock-db";
import { getRequestContext } from "@/lib/request-context";

export async function POST(request: Request) {
  const validation = await validateBody(request, noteSchema);
  if (!validation.ok) return validation.response;

  const ctx = await getRequestContext(request);
  const note = createNoteRecord(ctx, validation.data);
  logActivity(ctx, { type: "note.created", entityType: "note", entityId: note.id });

  return NextResponse.json(note, { status: 201 });
}
