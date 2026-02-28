import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Onboarding invites are handled client-side" }, { status: 501 });
}
