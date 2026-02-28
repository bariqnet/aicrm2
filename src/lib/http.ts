import { NextResponse } from "next/server";
import type { Schema } from "@/lib/validators";

export function errorResponse(message: string, status = 400, issues?: unknown): NextResponse {
  return NextResponse.json({ error: message, issues }, { status });
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function validateBody<T>(request: Request, schema: Schema<T>) {
  const body = await parseJsonBody(request);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return {
      ok: false as const,
      response: errorResponse("Validation failed", 400, parsed.error.issues)
    };
  }

  return {
    ok: true as const,
    data: parsed.data
  };
}
