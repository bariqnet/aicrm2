import { createHmac } from "crypto";
import { cookies } from "next/headers";
import type { SessionData } from "@/lib/crm-types";
import { SESSION_COOKIE_NAME } from "@/lib/session-constants";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getSessionSecret(): string {
  return process.env.SESSION_PASSWORD ?? "replace-with-long-random-string";
}

function signPayload(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function encodeSession(data: SessionData): string {
  const payload = Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

function decodeSession(raw: string): SessionData | null {
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  const expected = signPayload(payload);
  if (expected !== signature) return null;

  try {
    const json = Buffer.from(payload, "base64url").toString("utf8");
    return JSON.parse(json) as SessionData;
  } catch {
    return null;
  }
}

export async function getSessionData(): Promise<SessionData> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return {};
  return decodeSession(raw) ?? {};
}

export async function setSessionData(data: SessionData): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, encodeSession(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });
}

export async function clearSessionData(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0)
  });
}

export async function requireSessionData(): Promise<SessionData> {
  const session = await getSessionData();
  if (!session.token || !session.user) {
    throw new Error("Unauthorized");
  }
  return session;
}
