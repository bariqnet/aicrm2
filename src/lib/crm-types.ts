// Auth/session
export type SessionUser = { id: string; name: string; email: string };
export type SessionData = { token?: string; user?: SessionUser; workspaceId?: string };

// Workspace/identity
export type Workspace = { id: string; name: string; slug: string };
export type MembershipRole = "OWNER" | "ADMIN" | "MEMBER";
export type Membership = {
  id: string;
  userId: string;
  workspaceId: string;
  role: MembershipRole;
  createdAt: string;
};

// CRM taxonomy
export type CrmTypeId =
  | "software-company"
  | "dentist"
  | "education-institute"
  | "doctor"
  | "barber"
  | "other";

export type CrmStageTemplate = { name: string; order: number };
export type CrmTaskTemplate = {
  id: string;
  label: string;
  title: string;
  dueInDays?: number;
  relatedTypes?: Array<"contact" | "company" | "deal">;
};
export type CrmNoteTemplate = {
  id: string;
  label: string;
  body: string;
  relatedTypes?: Array<"contact" | "company" | "deal">;
};

// Main entities
export type Stage = { id: string; workspaceId: string; name: string; order: number };

export type CustomerTypeId = "B2B" | "B2C" | "PATIENT";

export type Contact = {
  id: string;
  workspaceId: string;
  ownerId: string;
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  companyId?: string | null;
  tags: string[];
  createdAt: string;
};

export type Company = {
  id: string;
  workspaceId: string;
  ownerId: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  size?: string | null;
};

export type DealStatus = "OPEN" | "WON" | "LOST";
export type Deal = {
  id: string;
  workspaceId: string;
  ownerId: string;
  title: string;
  amount: number;
  currency: string;
  stageId: string;
  companyId?: string | null;
  primaryContactId?: string | null;
  expectedCloseDate?: string | null;
  status: DealStatus;
  description?: string | null;
};

export type TaskStatus = "OPEN" | "DONE";
export type Task = {
  id: string;
  workspaceId: string;
  createdById: string;
  assigneeId?: string | null;
  title: string;
  dueAt?: string | null;
  status: TaskStatus;
  relatedType: "contact" | "company" | "deal" | "task";
  relatedId: string;
};

export type Note = {
  id: string;
  workspaceId: string;
  authorId: string;
  body: string;
  relatedType: "contact" | "company" | "deal" | "task";
  relatedId: string;
  createdAt: string;
};

export type Activity = {
  id: string;
  workspaceId: string;
  actorId: string;
  type: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type Invite = {
  id: string;
  workspaceId: string;
  email: string;
  role: MembershipRole;
  token: string;
  expiresAt: string;
  acceptedAt?: string | null;
};

// Invoices
export const INVOICE_STATUS_VALUES = ["DRAFT", "SENT", "PAID", "OVERDUE", "VOID"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUS_VALUES)[number];
export type InvoiceRelatedType = "contact" | "company";

export type Invoice = {
  id: string;
  workspaceId: string;
  createdById: string | null;
  invoiceNumber: string;
  title: string;
  notes: string | null;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  relatedType: InvoiceRelatedType | null;
  relatedId: string | null;
  contactId: string | null;
  companyId: string | null;
  issuedAt: Date | null;
  dueAt: Date | null;
  paidAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

// Visits (localStorage only)
export type VisitStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type Visit = {
  id: string;
  workspaceId: string;
  contactId: string;
  contactName: string;
  date: string;
  time: string;
  durationMinutes: number;
  reason: string;
  status: VisitStatus;
  notes?: string | null;
  createdAt: string;
};
