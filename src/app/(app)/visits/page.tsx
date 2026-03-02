"use client";

import { useEffect, useState } from "react";
import type { Visit, VisitStatus } from "@/lib/crm-types";
import {
  showErrorAlert,
  showInfoAlert,
  showSuccessAlert
} from "@/lib/sweet-alert";

export default function VisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [contactName, setContactName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadVisits() {
    try {
      const response = await fetch("/api/visits", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { rows?: Visit[]; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to load visits");
      }
      setVisits(payload?.rows ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load visits";
      await showErrorAlert("Visits load failed", message);
    }
  }

  useEffect(() => {
    loadVisits().catch(() => {
      // handled in loadVisits
    });
  }, []);

  async function create() {
    if (!contactName || !date || !time || !reason) {
      await showInfoAlert(
        "Missing details",
        "Please fill contact name, date, time, and reason before adding a visit."
      );
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: crypto.randomUUID(),
          contactName,
          date,
          time,
          durationMinutes: 30,
          reason,
          status: "SCHEDULED"
        })
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to create visit");
      }

      setContactName("");
      setDate("");
      setTime("");
      setReason("");
      await loadVisits();
      await showSuccessAlert("Visit scheduled", `${contactName} on ${date} at ${time}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create visit";
      await showErrorAlert("Visit creation failed", message);
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
        throw new Error(payload?.error ?? "Unable to update visit");
      }
      await loadVisits();
      await showSuccessAlert("Visit updated", `Status changed to ${status}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update visit";
      await showErrorAlert("Visit update failed", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-page">
      <header>
        <h1 className="page-title">Visits</h1>
        <p className="page-subtitle">Plan, confirm, and track every customer visit.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel space-y-3 p-4">
          <h2 className="text-sm font-semibold">Schedule visit</h2>
          <input className="input w-full" placeholder="Contact name" value={contactName} onChange={(event) => setContactName(event.target.value)} />
          <input className="input w-full" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <input className="input w-full" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
          <input className="input w-full" placeholder="Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
          <button type="button" className="btn btn-primary" onClick={create} disabled={loading}>
            {loading ? "Saving..." : "Add visit"}
          </button>
        </section>

        <section className="panel space-y-2 p-4">
          <h2 className="text-sm font-semibold">Scheduled visits</h2>
          {visits.length === 0 ? (
            <p className="text-sm text-mutedfg">No visits yet.</p>
          ) : (
            visits.map((visit) => (
              <article key={visit.id} className="rounded-md border border-border bg-surface2 p-3">
                <p className="font-medium">{visit.contactName}</p>
                <p className="text-sm text-mutedfg">{visit.date} {visit.time} • {visit.reason}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <button className="btn h-8" onClick={() => setStatus(visit.id, "SCHEDULED")}>Scheduled</button>
                  <button className="btn h-8" onClick={() => setStatus(visit.id, "COMPLETED")}>Completed</button>
                  <button className="btn h-8" onClick={() => setStatus(visit.id, "CANCELLED")}>Cancelled</button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
