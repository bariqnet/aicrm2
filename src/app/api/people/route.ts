import { NextResponse } from "next/server";
import { listPeople } from "@/lib/api";

export async function GET() {
  const data = await listPeople();
  return NextResponse.json(data);
}
