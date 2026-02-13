export type EntityType = "person" | "company" | "deal";

export type Person = {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  companyId: string;
  tags: string[];
  owner: string;
  lastTouchAt: string;
  createdAt: string;
};

export type Company = {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: number;
  location: string;
  tags: string[];
  owner: string;
  lastTouchAt: string;
  createdAt: string;
};

export type DealStage = "Lead" | "Qualified" | "Proposal" | "Negotiation" | "Won" | "Lost";

export type Deal = {
  id: string;
  name: string;
  companyId: string;
  personIds: string[];
  stage: DealStage;
  amount: number;
  currency: string;
  closeDate: string;
  owner: string;
  lastTouchAt: string;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  dueAt: string;
  status: "open" | "done";
  relatedType: EntityType;
  relatedId: string;
  owner: string;
};

export type Activity = {
  id: string;
  type: "meeting" | "email" | "call" | "note";
  subject: string;
  summary: string;
  occurredAt: string;
  relatedType: EntityType;
  relatedId: string;
  actor: string;
};
