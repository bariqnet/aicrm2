import { NextResponse } from "next/server";
import { listDeals } from "@/lib/api";

export async function GET() {
  const data = await listDeals();
  return NextResponse.json(data);
}
