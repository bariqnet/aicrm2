import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Onboarding stages setup is handled client-side" }, { status: 501 });
}
