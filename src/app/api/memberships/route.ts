import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ rows: [{ id: "membership_default", userId: "user_demo", workspaceId: "ws_default", role: "OWNER", createdAt: new Date().toISOString() }], total: 1 });
}
