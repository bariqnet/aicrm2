"use client";

import { useState } from "react";
import { createVisit, listVisits, updateVisitStatus } from "@/lib/visits-client";
import type { VisitStatus } from "@/lib/crm-types";
import {
  showInfoAlert,
  showSuccessAlert
} from "@/lib/sweet-alert";

const WORKSPACE_ID = "ws_default";

export default function VisitsPage() {
  const [, setTick] = useState(0);
  const [contactName, setContactName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");

  const visits = listVisits(WORKSPACE_ID);

  async function create() {
    if (!contactName || !date || !time || !reason) {
      await showInfoAlert(
        "Missing details",
        "Please fill contact name, date, time, and reason before adding a visit."
      );
      return;
    }
    createVisit({
      workspaceId: WORKSPACE_ID,
      contactId: crypto.randomUUID(),
      contactName,
      date,
      time,
      durationMinutes: 30,
      reason,
      status: "SCHEDULED"
    });
    setTick((value) => value + 1);
    await showSuccessAlert("Visit scheduled", `${contactName} on ${date} at ${time}`);
  }

  async function setStatus(id: string, status: VisitStatus) {
    updateVisitStatus(id, status);
    setTick((value) => value + 1);
    await showSuccessAlert("Visit updated", `Status changed to ${status}`);
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
          <button type="button" className="btn btn-primary" onClick={create}>Add visit</button>
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
