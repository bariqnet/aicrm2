import type { Activity, Company, Contact, Deal, DealStatus, Note, Stage, Task, TaskStatus } from "@/lib/crm-types";

export type RequestContext = {
  workspaceId: string;
  userId: string;
};

const DEFAULT_WORKSPACE_ID = "ws_default";

function makeId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

const db = {
  stages: [
    { id: "stage_lead", workspaceId: DEFAULT_WORKSPACE_ID, name: "Lead", order: 1 },
    { id: "stage_qualified", workspaceId: DEFAULT_WORKSPACE_ID, name: "Qualified", order: 2 },
    { id: "stage_proposal", workspaceId: DEFAULT_WORKSPACE_ID, name: "Proposal", order: 3 },
    { id: "stage_won", workspaceId: DEFAULT_WORKSPACE_ID, name: "Won", order: 4 }
  ] as Stage[],
  contacts: [] as Contact[],
  companies: [] as Company[],
  deals: [] as Deal[],
  tasks: [] as Task[],
  notes: [] as Note[],
  activities: [] as Activity[]
};

function workspaceFilter<T extends { workspaceId: string }>(rows: T[], workspaceId: string): T[] {
  return rows.filter((row) => row.workspaceId === workspaceId);
}

export function listContacts(ctx: RequestContext): Contact[] {
  return workspaceFilter(db.contacts, ctx.workspaceId);
}

export function listCompanies(ctx: RequestContext): Company[] {
  return workspaceFilter(db.companies, ctx.workspaceId);
}

export function listDeals(ctx: RequestContext): Deal[] {
  return workspaceFilter(db.deals, ctx.workspaceId);
}

export function listTasks(ctx: RequestContext): Task[] {
  return workspaceFilter(db.tasks, ctx.workspaceId);
}

export function listNotes(ctx: RequestContext): Note[] {
  return workspaceFilter(db.notes, ctx.workspaceId);
}

export function listActivities(ctx: RequestContext): Activity[] {
  return workspaceFilter(db.activities, ctx.workspaceId);
}

export function listStages(ctx: RequestContext): Stage[] {
  return workspaceFilter(db.stages, ctx.workspaceId).sort((a, b) => a.order - b.order);
}

export function getContactRecord(ctx: RequestContext, id: string): Contact | null {
  return db.contacts.find((row) => row.id === id && row.workspaceId === ctx.workspaceId) ?? null;
}

export function getCompanyRecord(ctx: RequestContext, id: string): Company | null {
  return db.companies.find((row) => row.id === id && row.workspaceId === ctx.workspaceId) ?? null;
}

export function getDealRecord(ctx: RequestContext, id: string): Deal | null {
  return db.deals.find((row) => row.id === id && row.workspaceId === ctx.workspaceId) ?? null;
}

export function getTaskRecord(ctx: RequestContext, id: string): Task | null {
  return db.tasks.find((row) => row.id === id && row.workspaceId === ctx.workspaceId) ?? null;
}

export function listTasksByRelation(
  ctx: RequestContext,
  relatedType: Task["relatedType"],
  relatedId: string
): Task[] {
  return listTasks(ctx).filter((task) => task.relatedType === relatedType && task.relatedId === relatedId);
}

export function listNotesByRelation(
  ctx: RequestContext,
  relatedType: Note["relatedType"],
  relatedId: string
): Note[] {
  return listNotes(ctx).filter((note) => note.relatedType === relatedType && note.relatedId === relatedId);
}

export function listActivitiesByEntity(
  ctx: RequestContext,
  entityType: string,
  entityId: string
): Activity[] {
  return listActivities(ctx).filter((activity) => activity.entityType === entityType && activity.entityId === entityId);
}

export function createCompanyRecord(
  ctx: RequestContext,
  input: { name: string; domain?: string; industry?: string; size?: string }
): Company {
  const record: Company = {
    id: makeId("company"),
    workspaceId: ctx.workspaceId,
    ownerId: ctx.userId,
    name: input.name,
    domain: input.domain ?? null,
    industry: input.industry ?? null,
    size: input.size ?? null
  };
  db.companies.unshift(record);
  return record;
}

export function updateCompanyRecord(
  ctx: RequestContext,
  id: string,
  input: { name: string; domain?: string; industry?: string; size?: string }
): Company | null {
  const index = db.companies.findIndex((row) => row.id === id && row.workspaceId === ctx.workspaceId);
  if (index < 0) return null;

  const next: Company = {
    ...db.companies[index],
    name: input.name,
    domain: input.domain ?? null,
    industry: input.industry ?? null,
    size: input.size ?? null
  };
  db.companies[index] = next;
  return next;
}

export function createContactRecord(
  ctx: RequestContext,
  input: {
    firstName: string;
    lastName: string;
    jobTitle?: string;
    email?: string;
    phone?: string;
    companyId?: string;
    tags?: string[];
  }
): Contact {
  const record: Contact = {
    id: makeId("contact"),
    workspaceId: ctx.workspaceId,
    ownerId: ctx.userId,
    firstName: input.firstName,
    lastName: input.lastName,
    jobTitle: input.jobTitle ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    companyId: input.companyId ?? null,
    tags: input.tags ?? [],
    createdAt: new Date().toISOString()
  };
  db.contacts.unshift(record);
  return record;
}

export function updateContactRecord(
  ctx: RequestContext,
  id: string,
  input: {
    firstName: string;
    lastName: string;
    jobTitle?: string;
    email?: string;
    phone?: string;
    companyId?: string;
    tags?: string[];
  }
): Contact | null {
  const index = db.contacts.findIndex((row) => row.id === id && row.workspaceId === ctx.workspaceId);
  if (index < 0) return null;

  const next: Contact = {
    ...db.contacts[index],
    firstName: input.firstName,
    lastName: input.lastName,
    jobTitle: input.jobTitle ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    companyId: input.companyId ?? null,
    tags: input.tags ?? []
  };
  db.contacts[index] = next;
  return next;
}

export function createDealRecord(
  ctx: RequestContext,
  input: {
    title: string;
    amount: number;
    currency: string;
    stageId: string;
    companyId?: string;
    primaryContactId?: string;
    expectedCloseDate?: string;
    status?: DealStatus;
    description?: string;
  }
): Deal {
  const record: Deal = {
    id: makeId("deal"),
    workspaceId: ctx.workspaceId,
    ownerId: ctx.userId,
    title: input.title,
    amount: input.amount,
    currency: input.currency,
    stageId: input.stageId,
    companyId: input.companyId ?? null,
    primaryContactId: input.primaryContactId ?? null,
    expectedCloseDate: input.expectedCloseDate ?? null,
    status: input.status ?? "OPEN",
    description: input.description ?? null
  };
  db.deals.unshift(record);
  return record;
}

export function updateDealRecord(
  ctx: RequestContext,
  id: string,
  input: {
    title?: string;
    amount?: number;
    currency?: string;
    stageId?: string;
    companyId?: string;
    primaryContactId?: string;
    expectedCloseDate?: string;
    status?: DealStatus;
    description?: string;
  }
): Deal | null {
  const index = db.deals.findIndex((row) => row.id === id && row.workspaceId === ctx.workspaceId);
  if (index < 0) return null;

  const current = db.deals[index];
  const next: Deal = {
    ...current,
    title: input.title ?? current.title,
    amount: input.amount ?? current.amount,
    currency: input.currency ?? current.currency,
    stageId: input.stageId ?? current.stageId,
    companyId: input.companyId === undefined ? current.companyId : input.companyId,
    primaryContactId:
      input.primaryContactId === undefined ? current.primaryContactId : input.primaryContactId,
    expectedCloseDate:
      input.expectedCloseDate === undefined ? current.expectedCloseDate : input.expectedCloseDate,
    status: input.status ?? current.status,
    description: input.description === undefined ? current.description : input.description
  };

  db.deals[index] = next;
  return next;
}

export function createTaskRecord(
  ctx: RequestContext,
  input: {
    title: string;
    dueAt?: string;
    assigneeId?: string;
    relatedType: "contact" | "company" | "deal" | "task";
    relatedId: string;
  }
): Task {
  const record: Task = {
    id: makeId("task"),
    workspaceId: ctx.workspaceId,
    createdById: ctx.userId,
    assigneeId: input.assigneeId ?? null,
    title: input.title,
    dueAt: input.dueAt ?? null,
    status: "OPEN",
    relatedType: input.relatedType,
    relatedId: input.relatedId
  };
  db.tasks.unshift(record);
  return record;
}

export function updateTaskStatusRecord(
  ctx: RequestContext,
  id: string,
  status: TaskStatus
): Task | null {
  const index = db.tasks.findIndex((row) => row.id === id && row.workspaceId === ctx.workspaceId);
  if (index < 0) return null;

  const next = { ...db.tasks[index], status };
  db.tasks[index] = next;
  return next;
}

export function deleteContactRecord(ctx: RequestContext, id: string): boolean {
  const index = db.contacts.findIndex((row) => row.id === id && row.workspaceId === ctx.workspaceId);
  if (index < 0) return false;
  db.contacts.splice(index, 1);
  return true;
}

export function deleteCompanyRecord(ctx: RequestContext, id: string): boolean {
  const index = db.companies.findIndex((row) => row.id === id && row.workspaceId === ctx.workspaceId);
  if (index < 0) return false;
  db.companies.splice(index, 1);
  return true;
}

export function deleteDealRecord(ctx: RequestContext, id: string): boolean {
  const index = db.deals.findIndex((row) => row.id === id && row.workspaceId === ctx.workspaceId);
  if (index < 0) return false;
  db.deals.splice(index, 1);
  return true;
}

export function deleteTaskRecord(ctx: RequestContext, id: string): boolean {
  const index = db.tasks.findIndex((row) => row.id === id && row.workspaceId === ctx.workspaceId);
  if (index < 0) return false;
  db.tasks.splice(index, 1);
  return true;
}

export function createNoteRecord(
  ctx: RequestContext,
  input: {
    body: string;
    relatedType: "contact" | "company" | "deal" | "task";
    relatedId: string;
  }
): Note {
  const record: Note = {
    id: makeId("note"),
    workspaceId: ctx.workspaceId,
    authorId: ctx.userId,
    body: input.body,
    relatedType: input.relatedType,
    relatedId: input.relatedId,
    createdAt: new Date().toISOString()
  };
  db.notes.unshift(record);
  return record;
}

export function createStageRecord(
  ctx: RequestContext,
  input: { name: string; order: number }
): Stage {
  const record: Stage = {
    id: makeId("stage"),
    workspaceId: ctx.workspaceId,
    name: input.name,
    order: input.order
  };
  db.stages.push(record);
  db.stages.sort((a, b) => a.order - b.order);
  return record;
}

export function logActivity(
  ctx: RequestContext,
  input: {
    type: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }
): Activity {
  const record: Activity = {
    id: makeId("activity"),
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    type: input.type,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata,
    createdAt: new Date().toISOString()
  };
  db.activities.unshift(record);
  return record;
}

export function importContacts(
  ctx: RequestContext,
  rows: Array<{
    firstName: string;
    lastName: string;
    jobTitle?: string;
    email?: string;
    phone?: string;
    companyId?: string;
    tags?: string[];
  }>
): Contact[] {
  const created: Contact[] = [];
  for (const row of rows) {
    created.push(createContactRecord(ctx, row));
  }
  return created;
}
