import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Invite acceptance is handled client-side" }, { status: 501 });
}
