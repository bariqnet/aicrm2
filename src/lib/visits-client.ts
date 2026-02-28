"use client";

import type { Visit, VisitStatus } from "@/lib/crm-types";

const VISITS_STORAGE_KEY = "aicrm.visits.v1";

type VisitInput = Omit<Visit, "id" | "createdAt">;

function readAll(): Visit[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(VISITS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Visit[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeAll(visits: Visit[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VISITS_STORAGE_KEY, JSON.stringify(visits));
}

export function listVisits(workspaceId: string): Visit[] {
  return readAll().filter((visit) => visit.workspaceId === workspaceId);
}

export function createVisit(input: VisitInput): Visit {
  const next: Visit = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  const all = readAll();
  all.unshift(next);
  writeAll(all);
  return next;
}

export function updateVisitStatus(visitId: string, status: VisitStatus): Visit | null {
  const all = readAll();
  const index = all.findIndex((item) => item.id === visitId);
  if (index < 0) return null;
  all[index] = { ...all[index], status };
  writeAll(all);
  return all[index];
}

export function upsertVisit(updated: Visit): Visit {
  const all = readAll();
  const index = all.findIndex((item) => item.id === updated.id);
  if (index < 0) {
    all.unshift(updated);
  } else {
    all[index] = updated;
  }
  writeAll(all);
  return updated;
}
