import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/auth";
import { generateJson } from "@/lib/ai-client";
import type {
  AiActionPriority,
  NextBestChannel,
  RelationshipHealthLabel,
  RelationshipIntelligence,
  RelationshipIntelligenceRequest,
  RelationshipIntelligenceResponse
} from "@/lib/ai-types";
import { errorResponse, parseJsonBody } from "@/lib/http";
import { decodeJournalEntry } from "@/lib/journal";

type JsonMap = Record<string, unknown>;

function asObject(input: unknown): JsonMap | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  return input as JsonMap;
}

function asString(input: unknown): string | null {
  return typeof input === "string" ? input : null;
}

function readString(source: JsonMap, key: string): string {
  const value = asString(source[key])?.trim();
  return value ?? "";
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, Math.round(numeric)));
}

function limitText(value: string, max = 260): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function normalizePriority(value: unknown, fallback: AiActionPriority = "medium"): AiActionPriority {
  if (value === "high" || value === "medium" || value === "low") return value;
  return fallback;
}

function normalizeChannel(value: unknown): NextBestChannel {
  if (value === "email" || value === "call" || value === "meeting" || value === "message") return value;
  return "email";
}

function normalizeHealthLabel(value: unknown): RelationshipHealthLabel {
  if (value === "strong" || value === "watch" || value === "at-risk" || value === "new") return value;
  return "watch";
}

function asStringArray(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeInsights(raw: unknown): RelationshipIntelligence {
  const source = asObject(raw) ?? {};
  const actionsSource = Array.isArray(source.recommendedActions) ? source.recommendedActions : [];

  return {
    summary: limitText(readString(source, "summary") || "No summary generated."),
    healthScore: clampNumber(source.healthScore, 55, 0, 100),
    healthLabel: normalizeHealthLabel(source.healthLabel),
    priority: normalizePriority(source.priority),
    signals: asStringArray(source.signals, 6),
    risks: asStringArray(source.risks, 4),
    recommendedActions: actionsSource.slice(0, 3).map((item, index) => {
      const action = asObject(item) ?? {};
      return {
        title: limitText(readString(action, "title") || `Action ${index + 1}`),
        reason: limitText(readString(action, "reason") || "No rationale provided."),
        priority: normalizePriority(action.priority)
      };
    }),
    outreachDraft: readString(source, "outreachDraft") || "No outreach draft generated.",
    nextBestChannel: normalizeChannel(source.nextBestChannel)
  };
}

function formatDate(value?: string | null): string {
  if (!value) return "unknown date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
}

function summarizeNoteBody(body: string): string {
  const journal = decodeJournalEntry(body);
  if (journal) {
    const parts = [
      `${journal.interactionType.toUpperCase()} - ${journal.subject}`,
      journal.summary,
      journal.nextAction ? `Next action: ${journal.nextAction}` : ""
    ].filter(Boolean);
    return parts.join(" | ");
  }

  return body.replace(/\s+/g, " ").trim();
}

function summarizeMetadata(metadata?: Record<string, unknown> | null): string {
  if (!metadata || typeof metadata !== "object") return "";
  const pairs = Object.entries(metadata).slice(0, 3);
  if (pairs.length === 0) return "";
  return pairs
    .map(([key, value]) => `${key}:${typeof value === "string" ? value : JSON.stringify(value)}`)
    .join(", ");
}

function toArrayOfObjects(value: unknown): JsonMap[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asObject(item))
    .filter((item): item is JsonMap => item !== null);
}

function normalizeRequestBody(body: unknown): RelationshipIntelligenceRequest | null {
  const source = asObject(body);
  if (!source) return null;

  const entityTypeRaw = readString(source, "entityType");
  const entityType = entityTypeRaw === "company" ? "company" : entityTypeRaw === "contact" ? "contact" : null;
  if (!entityType) return null;

  const entityId = readString(source, "entityId");
  const entityName = readString(source, "entityName");
  if (!entityId || !entityName) return null;

  const notes = toArrayOfObjects(source.notes).slice(0, 30).map((note) => ({
    body: limitText(readString(note, "body"), 600),
    createdAt: asString(note.createdAt)
  }));

  const activities = toArrayOfObjects(source.activities).slice(0, 30).map((activity) => ({
    type: limitText(readString(activity, "type"), 80),
    createdAt: asString(activity.createdAt),
    metadata: asObject(activity.metadata)
  }));

  const tasks = toArrayOfObjects(source.tasks).slice(0, 30).map((task) => ({
    title: limitText(readString(task, "title"), 120),
    status: limitText(readString(task, "status"), 24),
    dueAt: asString(task.dueAt)
  }));

  const deals = toArrayOfObjects(source.deals).slice(0, 20).map((deal) => ({
    title: limitText(readString(deal, "title"), 140),
    status: limitText(readString(deal, "status"), 24),
    amount: clampNumber(deal.amount, 0, 0, 10_000_000_000),
    currency: limitText(readString(deal, "currency") || "USD", 8)
  }));

  const invoices = toArrayOfObjects(source.invoices).slice(0, 20).map((invoice) => ({
    status: limitText(readString(invoice, "status"), 24),
    amount: clampNumber(invoice.amount, 0, 0, 10_000_000_000),
    currency: limitText(readString(invoice, "currency") || "USD", 8),
    dueAt: asString(invoice.dueAt),
    paidAt: asString(invoice.paidAt)
  }));

  return {
    entityType,
    entityId,
    entityName,
    notes,
    activities,
    tasks,
    deals,
    invoices
  };
}

function buildPrompt(input: RelationshipIntelligenceRequest): { system: string; user: string } {
  const notesBlock =
    input.notes.length === 0
      ? "No notes."
      : input.notes
          .map((note) => `- [${formatDate(note.createdAt)}] ${limitText(summarizeNoteBody(note.body), 320)}`)
          .join("\n");

  const activityBlock =
    input.activities.length === 0
      ? "No activity."
      : input.activities
          .map((entry) => {
            const meta = summarizeMetadata(entry.metadata);
            return `- [${formatDate(entry.createdAt)}] ${entry.type}${meta ? ` (${meta})` : ""}`;
          })
          .join("\n");

  const taskBlock =
    input.tasks.length === 0
      ? "No tasks."
      : input.tasks
          .map((task) => `- ${task.title} | status=${task.status} | due=${formatDate(task.dueAt)}`)
          .join("\n");

  const dealBlock =
    input.deals.length === 0
      ? "No deals."
      : input.deals
          .map((deal) => `- ${deal.title} | ${deal.status} | ${deal.amount} ${deal.currency}`)
          .join("\n");

  const invoiceBlock =
    input.invoices.length === 0
      ? "No invoices."
      : input.invoices
          .map(
            (invoice) =>
              `- status=${invoice.status} | amount=${invoice.amount} ${invoice.currency} | due=${formatDate(invoice.dueAt)} | paid=${formatDate(invoice.paidAt)}`
          )
          .join("\n");

  const system = [
    "You are Que AI CRM copilot.",
    "Analyze relationship quality and produce practical, near-term actions.",
    "Only use the provided CRM context. If data is missing, infer carefully and keep confidence moderate.",
    "Return strict JSON only."
  ].join(" ");

  const user = [
    `Entity type: ${input.entityType}`,
    `Entity name: ${input.entityName}`,
    `Entity ID: ${input.entityId}`,
    "",
    "Context:",
    `Notes (${input.notes.length}):`,
    notesBlock,
    "",
    `Activities (${input.activities.length}):`,
    activityBlock,
    "",
    `Tasks (${input.tasks.length}):`,
    taskBlock,
    "",
    `Deals (${input.deals.length}):`,
    dealBlock,
    "",
    `Invoices (${input.invoices.length}):`,
    invoiceBlock,
    "",
    "Return a JSON object with this exact shape:",
    "{",
    '  "summary": "string max ~280 chars",',
    '  "healthScore": "number 0..100",',
    '  "healthLabel": "strong|watch|at-risk|new",',
    '  "priority": "high|medium|low",',
    '  "signals": ["3-6 short bullet strings"],',
    '  "risks": ["0-4 short bullet strings"],',
    '  "recommendedActions": [{"title":"string","reason":"string","priority":"high|medium|low"}],',
    '  "outreachDraft": "short message draft to send to the customer in first person",',
    '  "nextBestChannel": "email|call|meeting|message"',
    "}",
    "recommendedActions must have exactly 3 items."
  ].join("\n");

  return { system, user };
}

export async function POST(request: Request) {
  const session = await getSessionData();
  if (!session.token) {
    return errorResponse("Unauthorized", 401);
  }

  const body = await parseJsonBody(request);
  const normalized = normalizeRequestBody(body);
  if (!normalized) {
    return errorResponse("Invalid request body", 400);
  }

  try {
    const prompt = buildPrompt(normalized);
    const generated = await generateJson<unknown>({
      systemPrompt: prompt.system,
      userPrompt: prompt.user,
      temperature: 0.2
    });

    const response: RelationshipIntelligenceResponse = {
      provider: generated.provider,
      model: generated.model,
      generatedAt: new Date().toISOString(),
      insights: normalizeInsights(generated.data)
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate AI relationship intelligence";
    const status = /missing ai api key/i.test(message) ? 503 : 500;
    return errorResponse(message, status);
  }
}
