import { NextResponse } from "next/server";
import { validateBody } from "@/lib/http";
import { taskSchema } from "@/lib/validators";
import { createTaskRecord, listTasks, logActivity } from "@/lib/mock-db";
import { getRequestContext } from "@/lib/request-context";

export async function GET() {
  const ctx = await getRequestContext();
  const rows = listTasks(ctx);
  return NextResponse.json({ rows, total: rows.length });
}

export async function POST(request: Request) {
  const validation = await validateBody(request, taskSchema);
  if (!validation.ok) return validation.response;

  const ctx = await getRequestContext(request);
  const task = createTaskRecord(ctx, validation.data);
  logActivity(ctx, { type: "task.created", entityType: "task", entityId: task.id });

  return NextResponse.json(task, { status: 201 });
}
