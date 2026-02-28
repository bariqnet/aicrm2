import type { SessionData, SessionUser } from "@/lib/crm-types";

type SessionPersistPayload = Required<Pick<SessionData, "token" | "user">> &
  Pick<SessionData, "workspaceId">;

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function normalizeSessionPayload(
  payload: unknown,
  fallback: { email: string; name?: string }
): SessionPersistPayload | null {
  const source = asObject(payload);
  if (!source) return null;

  const token =
    readString(source.token) ??
    readString(source.accessToken) ??
    readString(source.idToken) ??
    null;

  if (!token) return null;

  const userSource = asObject(source.user);
  const userId =
    readString(userSource?.id) ??
    readString(source.userId) ??
    readString(source.sub) ??
    "user_from_auth";

  const email = readString(userSource?.email) ?? fallback.email;
  if (!email) return null;

  const user: SessionUser = {
    id: userId,
    name: readString(userSource?.name) ?? fallback.name ?? email,
    email
  };

  const workspaceObject = asObject(source.workspace);
  const workspaceId =
    readString(source.workspaceId) ?? readString(workspaceObject?.id);

  return { token, user, workspaceId };
}

export async function persistSession(payload: SessionPersistPayload): Promise<void> {
  const response = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorBody?.error ?? "Unable to persist session");
  }
}
