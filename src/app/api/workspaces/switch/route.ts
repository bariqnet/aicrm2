import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Switching workspaces is handled client-side" }, { status: 501 });
}
