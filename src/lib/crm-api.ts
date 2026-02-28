export type ApiQuery = Record<string, string | number | boolean | null | undefined>;

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
  query?: ApiQuery;
  baseUrl?: string;
};

type ListEnvelope<T> = {
  rows?: T[];
  items?: T[];
  data?: T[];
  nextCursor?: string | null;
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function resolveBaseUrl(customBaseUrl?: string): string {
  if (customBaseUrl) return trimTrailingSlash(customBaseUrl);

  const envBase = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!envBase) return "";
  return trimTrailingSlash(envBase);
}

function withQuery(url: URL, query?: ApiQuery): URL {
  if (!query) return url;
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    url.searchParams.set(key, String(value));
  }
  return url;
}

function buildUrl(path: string, query?: ApiQuery, baseUrl?: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return withQuery(new URL(path), query).toString();
  }

  const base = resolveBaseUrl(baseUrl);
  if (!base) {
    throw new Error("Missing API base URL. Set API_BASE_URL or NEXT_PUBLIC_API_BASE_URL.");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return withQuery(new URL(`${base}${normalizedPath}`), query).toString();
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, token, query, headers, baseUrl, ...init } = options;
  const url = buildUrl(path, query, baseUrl);

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && typeof (payload as { message?: unknown }).message === "string"
        ? (payload as { message: string }).message
        : `API request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}

export async function listAll<T>(path: string, options: Omit<ApiRequestOptions, "query"> & { query?: ApiQuery } = {}): Promise<T[]> {
  const all: T[] = [];
  let cursor: string | null = null;
  let safetyCounter = 0;

  do {
    const query: ApiQuery = { ...(options.query ?? {}), ...(cursor ? { cursor } : {}) };
    const payload: T[] | ListEnvelope<T> = await apiRequest<T[] | ListEnvelope<T>>(path, {
      ...options,
      query
    });

    if (Array.isArray(payload)) {
      all.push(...payload);
      break;
    }

    const chunk = payload.rows ?? payload.items ?? payload.data ?? [];
    all.push(...chunk);
    cursor = payload.nextCursor ?? null;
    safetyCounter += 1;
  } while (cursor && safetyCounter < 100);

  return all;
}
