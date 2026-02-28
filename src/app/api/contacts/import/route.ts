import { NextResponse } from "next/server";
import { errorResponse, parseJsonBody } from "@/lib/http";
import { getRequestContext } from "@/lib/request-context";
import { importContacts } from "@/lib/mock-db";

function parseCsvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell.trim());
    cell = "";
  };

  const pushRow = () => {
    if (row.length === 0) return;
    const hasValue = row.some((value) => value.length > 0);
    if (hasValue) rows.push(row);
    row = [];
  };

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ",") {
      pushCell();
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") i += 1;
      pushCell();
      pushRow();
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    pushCell();
    pushRow();
  }

  return rows;
}

function parseCsv(csv: string) {
  const rows = parseCsvRows(csv);
  if (rows.length < 2) return [];

  const header = rows[0].map((col) => col.trim());
  return rows.slice(1).map((values) => {
    const row = Object.fromEntries(
      header.map((key, index) => [key, values[index] ?? ""])
    ) as Record<string, string>;

    return {
      firstName: row.firstName ?? "",
      lastName: row.lastName ?? "",
      jobTitle: row.jobTitle || undefined,
      email: row.email || undefined,
      phone: row.phone || undefined,
      companyId: row.companyId || undefined,
      tags: row.tags ? row.tags.split("|").map((tag) => tag.trim()).filter(Boolean) : []
    };
  });
}

export async function POST(request: Request) {
  const body = (await parseJsonBody(request)) as { csv?: unknown } | null;
  if (!body || typeof body.csv !== "string") {
    return errorResponse("Expected body with csv string", 400);
  }

  const rows = parseCsv(body.csv).filter((row) => row.firstName && row.lastName);
  if (rows.length === 0) return errorResponse("No valid rows found in CSV", 400);

  const ctx = await getRequestContext(request);
  const created = importContacts(ctx, rows);

  return NextResponse.json({ imported: created.length, rows: created });
}
