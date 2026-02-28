import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([{ id: "user_demo", name: "Demo User", email: "demo@example.com" }]);
}
