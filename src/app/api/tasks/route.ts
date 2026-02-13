import { NextResponse } from "next/server";
import { listTasks } from "@/lib/api";

export async function GET() {
  const data = await listTasks();
  return NextResponse.json(data);
}
