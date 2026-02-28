import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Onboarding workspace creation is handled client-side" }, { status: 501 });
}
