import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ rows: [{ id: "ws_default", name: "Default Workspace", slug: "default-workspace" }], total: 1 });
}
