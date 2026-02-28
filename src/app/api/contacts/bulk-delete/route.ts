import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Bulk delete is not supported" }, { status: 501 });
}
