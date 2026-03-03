"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import type { Contact, Visit, VisitStatus } from "@/lib/crm-types";
import {
  showErrorAlert,
  showInfoAlert,
  showSuccessAlert
} from "@/lib/sweet-alert";

export default function VisitsPage() {
  const { language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);
  const visitStatusLabel = (status: VisitStatus) => (
    status === "COMPLETED"
      ? tr("Completed", "مكتملة")
      : status === "CANCELLED"
        ? tr("Cancelled", "ملغاة")
        : tr("Scheduled", "مجدولة")
  );

  const [visits, setVisits] = useState<Visit[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactId, setContactId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [loading, setLoading] = useState(false);

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === contactId) ?? null,
    [contacts, contactId]
  );

  async function loadVisits() {
    try {
      const response = await fetch("/api/visits", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { rows?: Visit[]; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? tr("Unable to load visits", "تعذر تحميل الزيارات"));
      }
      setVisits(payload?.rows ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : tr("Unable to load visits", "تعذر تحميل الزيارات");
      await showErrorAlert(tr("Visits load failed", "فشل تحميل الزيارات"), message);
    }
  }

  async function loadContacts() {
    try {
      const response = await fetch("/api/contacts");
      if (!response.ok) return;
      const payload = (await response.json().catch(() => null)) as
        | { rows?: Contact[] }
        | null;
      setContacts(payload?.rows ?? []);
    } catch {
      // Form still works with existing visits even if contacts fail to load.
    }
  }

  useEffect(() => {
    loadVisits().catch(() => {
      // handled in loadVisits
    });
    loadContacts().catch(() => {
      // handled in loadContacts
    });
  }, []);

  async function create() {
    if (!contactId || !date || !time || !reason) {
      await showInfoAlert(
        tr("Missing details", "بيانات ناقصة"),
        tr("Please fill contact, date, time, and reason before adding a visit.", "يرجى تعبئة جهة الاتصال والتاريخ والوقت والسبب قبل إضافة زيارة.")
      );
      return;
    }

    if (!selectedContact) {
      await showErrorAlert(tr("Invalid contact", "جهة اتصال غير صالحة"), tr("Choose a valid contact before saving the visit.", "اختر جهة اتصال صالحة قبل حفظ الزيارة."));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          contactName: `${selectedContact.firstName} ${selectedContact.lastName}`.trim(),
          date,
          time,
          durationMinutes: Number(durationMinutes) || 30,
          reason,
          status: "SCHEDULED"
        })
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? tr("Unable to create visit", "تعذر إنشاء الزيارة"));
      }

      setContactId("");
      setDate("");
      setTime("");
      setReason("");
      setDurationMinutes("30");
      await loadVisits();
      await showSuccessAlert(
        tr("Visit scheduled", "تمت جدولة الزيارة"),
        `${selectedContact.firstName} ${selectedContact.lastName} ${tr("on", "في")} ${date} ${tr("at", "الساعة")} ${time}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : tr("Unable to create visit", "تعذر إنشاء الزيارة");
      await showErrorAlert(tr("Visit creation failed", "فشل إنشاء الزيارة"), message);
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(id: string, status: VisitStatus) {
    setLoading(true);
    try {
      const response = await fetch(`/api/visits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? tr("Unable to update visit", "تعذر تحديث الزيارة"));
      }
      await loadVisits();
      await showSuccessAlert(tr("Visit updated", "تم تحديث الزيارة"), `${tr("Status changed to", "تم تغيير الحالة إلى")} ${visitStatusLabel(status)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : tr("Unable to update visit", "تعذر تحديث الزيارة");
      await showErrorAlert(tr("Visit update failed", "فشل تحديث الزيارة"), message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-page">
      <header>
        <h1 className="page-title">{tr("Visits", "الزيارات")}</h1>
        <p className="page-subtitle">{tr("Plan, confirm, and track every customer visit.", "خطط وأكّد وتابع كل زيارة عميل.")}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel space-y-3 p-4">
          <h2 className="text-sm font-semibold">{tr("Schedule visit", "جدولة زيارة")}</h2>
          <select className="input w-full" value={contactId} onChange={(event) => setContactId(event.target.value)}>
            <option value="">{tr("Select contact", "اختر جهة اتصال")}</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.firstName} {contact.lastName}
              </option>
            ))}
          </select>
          <input className="input w-full" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <input className="input w-full" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
          <input className="input w-full" placeholder={tr("Reason", "السبب")} value={reason} onChange={(event) => setReason(event.target.value)} />
          <input
            className="input w-full"
            type="number"
            min="5"
            step="5"
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(event.target.value)}
            placeholder={tr("Duration in minutes", "المدة بالدقائق")}
          />
          <button type="button" className="btn btn-primary" onClick={create} disabled={loading}>
            {loading ? tr("Saving...", "جاري الحفظ...") : tr("Add visit", "إضافة زيارة")}
          </button>
        </section>

        <section className="panel space-y-2 p-4">
          <h2 className="text-sm font-semibold">{tr("Scheduled visits", "الزيارات المجدولة")}</h2>
          {visits.length === 0 ? (
            <p className="text-sm text-mutedfg">{tr("No visits yet.", "لا توجد زيارات بعد.")}</p>
          ) : (
            visits.map((visit) => (
              <article key={visit.id} className="rounded-md border border-border bg-surface2 p-3">
                <p className="font-medium">{visit.contactName}</p>
                <p className="text-sm text-mutedfg">
                  {visit.date} {visit.time} · {visit.reason}
                </p>
                <p className="mt-1 text-xs text-mutedfg">{visit.durationMinutes} {tr("minutes", "دقيقة")}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <button className="btn h-8" onClick={() => setStatus(visit.id, "SCHEDULED")}>{tr("Scheduled", "مجدولة")}</button>
                  <button className="btn h-8" onClick={() => setStatus(visit.id, "COMPLETED")}>{tr("Completed", "مكتملة")}</button>
                  <button className="btn h-8" onClick={() => setStatus(visit.id, "CANCELLED")}>{tr("Cancelled", "ملغاة")}</button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
