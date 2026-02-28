import { NextResponse } from "next/server";
import { errorResponse, validateBody } from "@/lib/http";
import { taskStatusSchema } from "@/lib/validators";
import { getRequestContext } from "@/lib/request-context";
import {
  deleteTaskRecord,
  getTaskRecord,
  updateTaskStatusRecord
} from "@/lib/mock-db";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getRequestContext(request);
  const { id } = await context.params;
  const task = getTaskRecord(ctx, id);
  if (!task) return errorResponse("Task not found", 404);
  return NextResponse.json(task);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const validation = await validateBody(request, taskStatusSchema);
  if (!validation.ok) return validation.response;

  const ctx = await getRequestContext(request);
  const { id } = await context.params;
  const task = updateTaskStatusRecord(ctx, id, validation.data.status);

  if (!task) return errorResponse("Task not found", 404);
  return NextResponse.json(task);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getRequestContext(request);
  const { id } = await context.params;
  const deleted = deleteTaskRecord(ctx, id);
  if (!deleted) return errorResponse("Task not found", 404);
  return NextResponse.json({ ok: true });
}
