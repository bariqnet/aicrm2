"use client";

import type { CrmTypeId } from "@/lib/crm-types";

const STORAGE_KEY = "aicrm.crmTypeId";

export function getStoredCrmTypeId(): CrmTypeId | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (
    raw === "software-company" ||
    raw === "dentist" ||
    raw === "education-institute" ||
    raw === "doctor" ||
    raw === "barber" ||
    raw === "other"
  ) {
    return raw;
  }
  return null;
}

export function setStoredCrmTypeId(typeId: CrmTypeId): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, typeId);
}
