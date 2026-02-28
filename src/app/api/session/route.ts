import { NextResponse } from "next/server";
import { clearSessionData, setSessionData } from "@/lib/auth";
import type { SessionData } from "@/lib/crm-types";

function isValidSessionUser(value: unknown): value is NonNullable<SessionData["user"]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const user = value as Record<string, unknown>;
  return (
    typeof user.id === "string" &&
    typeof user.name === "string" &&
    typeof user.email === "string"
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<SessionData> | null;

  if (!body || typeof body.token !== "string" || !isValidSessionUser(body.user)) {
    return NextResponse.json(
      { error: "Invalid session payload" },
      { status: 400 }
    );
  }

  await setSessionData({
    token: body.token,
    user: body.user,
    workspaceId: typeof body.workspaceId === "string" ? body.workspaceId : undefined
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearSessionData();
  return NextResponse.json({ ok: true });
}
