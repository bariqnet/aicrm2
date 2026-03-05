import { getSessionData } from "@/lib/auth";
import { ApiRequestError, apiRequest, type ApiQuery } from "@/lib/crm-api";

export type ServerListResponse<T> = {
  rows: T[];
  total: number;
  nextCursor?: string | null;
};

type ServerApiOptions = {
  query?: ApiQuery;
};

export class SessionInvalidError extends Error {
  constructor(message = "Invalid session") {
    super(message);
    this.name = "SessionInvalidError";
  }
}

function isNotFoundError(error: unknown): boolean {
  if (error instanceof ApiRequestError) return error.status === 404;
  if (!(error instanceof Error)) return false;
  return error.message.includes("(404)") || error.message.toLowerCase().includes("not found");
}

function isAuthError(error: unknown): boolean {
  if (error instanceof ApiRequestError) {
    if (error.status === 401 || error.status === 403) return true;
    if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") return true;
  }
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("invalid token") || message.includes("unauthorized");
}

export async function serverApiRequest<T>(path: string, options: ServerApiOptions = {}): Promise<T> {
  const session = await getSessionData();
  if (!session.token) {
    throw new SessionInvalidError("Unauthorized");
  }

  try {
    return await apiRequest<T>(path, {
      token: session.token,
      workspaceId: session.workspaceId,
      query: options.query,
      cache: "no-store"
    });
  } catch (error) {
    if (isAuthError(error)) {
      throw new SessionInvalidError(error instanceof Error ? error.message : "Unauthorized");
    }
    throw error;
  }
}

export async function serverApiRequestOrNull<T>(path: string, options: ServerApiOptions = {}): Promise<T | null> {
  try {
    return await serverApiRequest<T>(path, options);
  } catch (error) {
    if (isNotFoundError(error)) return null;
    throw error;
  }
}
