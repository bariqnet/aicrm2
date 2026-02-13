import { Activity, Company, Deal, DealStage, Person, Task } from "@/lib/types";

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();

export const stages: DealStage[] = ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];

export const people: Person[] = [
  { id: "p1", name: "Ava Chen", title: "VP Ops", email: "ava@northstar.com", phone: "555-1001", companyId: "c1", tags: ["Champion"], owner: "Jordan", lastTouchAt: daysAgo(1), createdAt: daysAgo(50) },
  { id: "p2", name: "Milo Reed", title: "CTO", email: "milo@bright.io", phone: "555-1002", companyId: "c2", tags: ["Technical"], owner: "Riley", lastTouchAt: daysAgo(4), createdAt: daysAgo(45) }
];

export const companies: Company[] = [
  { id: "c1", name: "Northstar Labs", domain: "northstar.com", industry: "Biotech", size: 120, location: "Boston", tags: ["Expansion"], owner: "Jordan", lastTouchAt: daysAgo(1), createdAt: daysAgo(100) },
  { id: "c2", name: "Brightlayer", domain: "bright.io", industry: "SaaS", size: 60, location: "Austin", tags: ["SMB"], owner: "Riley", lastTouchAt: daysAgo(3), createdAt: daysAgo(90) }
];

export const deals: Deal[] = [
  { id: "d1", name: "Northstar Platform", companyId: "c1", personIds: ["p1"], stage: "Negotiation", amount: 85000, currency: "USD", closeDate: daysAgo(-20), owner: "Jordan", lastTouchAt: daysAgo(1), createdAt: daysAgo(40) },
  { id: "d2", name: "Brightlayer Rollout", companyId: "c2", personIds: ["p2"], stage: "Proposal", amount: 42000, currency: "USD", closeDate: daysAgo(-30), owner: "Riley", lastTouchAt: daysAgo(2), createdAt: daysAgo(33) }
];

export const tasks: Task[] = [
  { id: "t1", title: "Send updated pricing", dueAt: daysAgo(0), status: "open", relatedType: "deal", relatedId: "d1", owner: "Jordan" },
  { id: "t2", title: "Book demo follow-up", dueAt: daysAgo(-2), status: "open", relatedType: "person", relatedId: "p2", owner: "Riley" }
];

export const activities: Activity[] = [
  { id: "a1", type: "meeting", subject: "Quarterly planning", summary: "Reviewed rollout timeline.", occurredAt: daysAgo(1), relatedType: "deal", relatedId: "d1", actor: "Jordan" },
  { id: "a2", type: "email", subject: "Security answers", summary: "Shared SOC2 package.", occurredAt: daysAgo(3), relatedType: "company", relatedId: "c2", actor: "Riley" },
  { id: "a3", type: "call", subject: "Discovery call", summary: "Confirmed budget owner.", occurredAt: daysAgo(4), relatedType: "person", relatedId: "p1", actor: "Jordan" }
];
