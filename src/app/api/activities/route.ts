import { NextResponse } from "next/server";
import { listActivities } from "@/lib/api";

export async function GET() {
  const data = await listActivities();
  return NextResponse.json(data);
}
