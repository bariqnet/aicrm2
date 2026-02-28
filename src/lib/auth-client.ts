"use client";

import type { SessionData } from "@/lib/crm-types";
import { SESSION_COOKIE_NAME } from "@/lib/session-constants";

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return atob(normalized + padding);
}

export function readSessionCookie(): SessionData | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`));

  if (!raw) return null;
  const value = raw.slice(SESSION_COOKIE_NAME.length + 1);
  const payload = value.split(".")[0];
  if (!payload) return null;

  try {
    const json = decodeBase64Url(payload);
    return JSON.parse(json) as SessionData;
  } catch {
    return null;
  }
}

export function getClientToken(): string | undefined {
  return readSessionCookie()?.token;
}
