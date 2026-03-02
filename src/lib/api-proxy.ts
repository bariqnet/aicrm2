import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/auth";
import { getExternalApiBaseUrl } from "@/lib/api-base";

type ProxyOptions = {
  method?: string;
  includeQuery?: boolean;
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function resolveExternalApiBaseUrl(): string {
  return trimTrailingSlash(getExternalApiBaseUrl());
}

function buildProxyHeaders(request: Request, token?: string, workspaceId?: string): Headers {
  const headers = new Headers();
  const accept = request.headers.get("accept");
  const contentType = request.headers.get("content-type");
  const authHeader = request.headers.get("authorization");
  const workspaceHeader = request.headers.get("x-workspace-id");

  if (accept) headers.set("accept", accept);
  if (contentType) headers.set("content-type", contentType);
  if (authHeader) headers.set("authorization", authHeader);
  else if (token) headers.set("authorization", `Bearer ${token}`);
  if (workspaceHeader) headers.set("x-workspace-id", workspaceHeader);
  else if (workspaceId) headers.set("x-workspace-id", workspaceId);

  return headers;
}

export async function proxyExternalApi(
  request: Request,
  path: string,
  options: ProxyOptions = {}
): Promise<Response> {
  try {
    const baseUrl = resolveExternalApiBaseUrl();
    const sourceUrl = new URL(request.url);
    const targetUrl = new URL(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`);

    if (options.includeQuery !== false) {
      targetUrl.search = sourceUrl.search;
    }

    const session = await getSessionData();
    const method = options.method ?? request.method;
    const hasBody = method !== "GET" && method !== "HEAD";
    const body = hasBody ? await request.arrayBuffer() : undefined;

    const response = await fetch(targetUrl, {
      method,
      headers: buildProxyHeaders(request, session.token, session.workspaceId),
      body
    });

    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Proxy request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
