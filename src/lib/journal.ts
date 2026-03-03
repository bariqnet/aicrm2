import type { Activity, Note } from "@/lib/crm-types";

const JOURNAL_PREFIX = "[QUE_JOURNAL_V1]";

export const JOURNAL_INTERACTION_TYPES = [
  "call",
  "meeting",
  "email",
  "message",
  "visit",
  "note"
] as const;

export type JournalInteractionType = (typeof JOURNAL_INTERACTION_TYPES)[number];

export type JournalEntryPayload = {
  interactionType: JournalInteractionType;
  subject: string;
  summary: string;
  details?: string;
  nextAction?: string;
};

export type RelationshipTimelineItem = {
  id: string;
  source: "journal" | "note" | "activity";
  occurredAt: string | null;
  sortAt: number;
  title: string;
  summary: string;
  details?: string;
};

function trimOptional(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function readTimestamp(value?: string | null): number {
  if (!value) return 0;
  const parsed = +new Date(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isJournalInteractionType(value: string): value is JournalInteractionType {
  return (JOURNAL_INTERACTION_TYPES as readonly string[]).includes(value);
}

function normalizeInteractionLabel(value: JournalInteractionType): string {
  return value[0].toUpperCase() + value.slice(1);
}

function normalizeActivityTitle(type: string): string {
  const clean = type.trim().replace(/[_-]+/g, " ");
  if (!clean) return "Activity";
  return clean
    .split(/\s+/)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function metadataSummary(metadata: Activity["metadata"]): string | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const entries = Object.entries(metadata).slice(0, 3);
  if (entries.length === 0) return undefined;
  return entries
    .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
    .join(" · ");
}

export function encodeJournalEntry(payload: JournalEntryPayload): string {
  const encoded = {
    interactionType: payload.interactionType,
    subject: payload.subject.trim(),
    summary: payload.summary.trim(),
    details: trimOptional(payload.details),
    nextAction: trimOptional(payload.nextAction)
  };

  return `${JOURNAL_PREFIX}${JSON.stringify(encoded)}`;
}

export function decodeJournalEntry(body: string): JournalEntryPayload | null {
  if (!body.startsWith(JOURNAL_PREFIX)) return null;

  try {
    const raw = JSON.parse(body.slice(JOURNAL_PREFIX.length)) as {
      interactionType?: string;
      subject?: string;
      summary?: string;
      details?: string;
      nextAction?: string;
    };

    if (
      typeof raw.interactionType !== "string" ||
      !isJournalInteractionType(raw.interactionType) ||
      typeof raw.subject !== "string" ||
      typeof raw.summary !== "string"
    ) {
      return null;
    }

    const subject = raw.subject.trim();
    const summary = raw.summary.trim();
    if (!subject || !summary) return null;

    return {
      interactionType: raw.interactionType,
      subject,
      summary,
      details: trimOptional(raw.details),
      nextAction: trimOptional(raw.nextAction)
    };
  } catch {
    return null;
  }
}

export function buildRelationshipTimeline(notes: Note[], activities: Activity[]): RelationshipTimelineItem[] {
  const noteItems: RelationshipTimelineItem[] = notes.map((note) => {
    const decoded = decodeJournalEntry(note.body);
    const sortAt = readTimestamp(note.createdAt);
    const occurredAt = note.createdAt ?? null;

    if (decoded) {
      return {
        id: `journal-${note.id}`,
        source: "journal",
        occurredAt,
        sortAt,
        title: `${normalizeInteractionLabel(decoded.interactionType)} · ${decoded.subject}`,
        summary: decoded.summary,
        details: decoded.nextAction
          ? `${decoded.details ? `${decoded.details}\n\n` : ""}Next action: ${decoded.nextAction}`
          : decoded.details
      };
    }

    return {
      id: `note-${note.id}`,
      source: "note",
      occurredAt,
      sortAt,
      title: "General note",
      summary: note.body.trim() || "No content"
    };
  });

  const activityItems: RelationshipTimelineItem[] = activities.map((activity) => ({
    id: `activity-${activity.id}`,
    source: "activity",
    occurredAt: activity.createdAt ?? null,
    sortAt: readTimestamp(activity.createdAt),
    title: normalizeActivityTitle(activity.type),
    summary: `System update on ${activity.entityType}`,
    details: metadataSummary(activity.metadata)
  }));

  return [...noteItems, ...activityItems].sort((a, b) => b.sortAt - a.sortAt);
}
