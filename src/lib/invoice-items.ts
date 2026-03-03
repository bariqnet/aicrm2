import type { InvoiceLineItem } from "@/lib/crm-types";

type ParsedInvoiceNotes = {
  plainNotes: string;
  items: InvoiceLineItem[];
};

const ITEMS_BLOCK_START = "[[QUE_INVOICE_ITEMS_V1]]";
const ITEMS_BLOCK_END = "[[/QUE_INVOICE_ITEMS_V1]]";

const ITEMS_BLOCK_PATTERN = new RegExp(
  `\\n?${escapeRegExp(ITEMS_BLOCK_START)}\\n([\\s\\S]*?)\\n${escapeRegExp(ITEMS_BLOCK_END)}\\s*$`
);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function sanitizeInvoiceLineItems(input: unknown): InvoiceLineItem[] {
  if (!Array.isArray(input)) return [];

  const parsed: InvoiceLineItem[] = [];

  for (const item of input) {
    if (!item || typeof item !== "object") continue;

    const source = item as Record<string, unknown>;
    const description = typeof source.description === "string" ? source.description.trim() : "";
    const quantity = typeof source.quantity === "number" ? source.quantity : Number(source.quantity);
    const unitPrice = typeof source.unitPrice === "number" ? source.unitPrice : Number(source.unitPrice);

    if (!description) continue;
    if (!Number.isFinite(quantity) || quantity <= 0) continue;
    if (!Number.isFinite(unitPrice) || unitPrice < 0) continue;

    parsed.push({
      description,
      quantity: roundCurrency(quantity),
      unitPrice: roundCurrency(unitPrice)
    });
  }

  return parsed;
}

export function computeInvoiceItemsTotal(items: InvoiceLineItem[]): number {
  return roundCurrency(items.reduce((total, item) => total + item.quantity * item.unitPrice, 0));
}

export function parseInvoiceNotes(notes?: string | null): ParsedInvoiceNotes {
  if (!notes) return { plainNotes: "", items: [] };

  const match = notes.match(ITEMS_BLOCK_PATTERN);
  if (!match) {
    return { plainNotes: notes.trim(), items: [] };
  }

  let parsedItems: InvoiceLineItem[] = [];
  try {
    const jsonValue = JSON.parse(match[1]) as unknown;
    parsedItems = sanitizeInvoiceLineItems(jsonValue);
  } catch {
    parsedItems = [];
  }

  const plainNotes = notes.replace(ITEMS_BLOCK_PATTERN, "").trim();
  return { plainNotes, items: parsedItems };
}

export function buildInvoiceNotes(plainNotes: string | undefined, items: InvoiceLineItem[]): string | undefined {
  const cleanedNotes = (plainNotes ?? "").trim();
  const cleanedItems = sanitizeInvoiceLineItems(items);

  if (cleanedItems.length === 0) {
    return cleanedNotes || undefined;
  }

  const encodedItems = JSON.stringify(cleanedItems);
  if (!cleanedNotes) {
    return `${ITEMS_BLOCK_START}\n${encodedItems}\n${ITEMS_BLOCK_END}`;
  }

  return `${cleanedNotes}\n${ITEMS_BLOCK_START}\n${encodedItems}\n${ITEMS_BLOCK_END}`;
}
