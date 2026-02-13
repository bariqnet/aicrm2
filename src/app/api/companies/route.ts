import { NextResponse } from "next/server";
import { listCompanies } from "@/lib/api";

export async function GET() {
  const data = await listCompanies();
  return NextResponse.json(data);
}
