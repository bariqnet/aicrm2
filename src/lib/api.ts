import type { Activity, Company, Contact, Deal, Note, Stage, Task } from "@/lib/crm-types";

export type ListResponse<T> = {
  rows: T[];
  total: number;
};

// Internal API wrapper used by app routes/components.
export async function appApiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const normalized = path.startsWith("/api/") ? path : `/api${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(normalized, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function createCompanyApi(input: {
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
}): Promise<Company> {
  return appApiRequest<Company>("/companies", { method: "POST", body: JSON.stringify(input) });
}

export async function createContactApi(input: {
  firstName: string;
  lastName: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  companyId?: string;
  tags?: string[];
}): Promise<Contact> {
  return appApiRequest<Contact>("/contacts", { method: "POST", body: JSON.stringify(input) });
}

export async function createDealApi(input: {
  title: string;
  amount: number;
  currency: string;
  stageId: string;
  companyId?: string;
  primaryContactId?: string;
  expectedCloseDate?: string;
  status?: "OPEN" | "WON" | "LOST";
  description?: string;
}): Promise<Deal> {
  return appApiRequest<Deal>("/deals", { method: "POST", body: JSON.stringify(input) });
}

export async function createTaskApi(input: {
  title: string;
  dueAt?: string;
  assigneeId?: string;
  relatedType: "contact" | "company" | "deal" | "task";
  relatedId: string;
}): Promise<Task> {
  return appApiRequest<Task>("/tasks", { method: "POST", body: JSON.stringify(input) });
}

export async function createNoteApi(input: {
  body: string;
  relatedType: "contact" | "company" | "deal" | "task";
  relatedId: string;
}): Promise<Note> {
  return appApiRequest<Note>("/notes", { method: "POST", body: JSON.stringify(input) });
}

export async function createStageApi(input: { name: string; order: number }): Promise<Stage> {
  return appApiRequest<Stage>("/stages", { method: "POST", body: JSON.stringify(input) });
}

export async function listContactsApi(query?: { q?: string }): Promise<ListResponse<Contact>> {
  const search = query?.q ? `?q=${encodeURIComponent(query.q)}` : "";
  return appApiRequest<ListResponse<Contact>>(`/contacts${search}`);
}

export async function listCompaniesApi(query?: { q?: string }): Promise<ListResponse<Company>> {
  const search = query?.q ? `?q=${encodeURIComponent(query.q)}` : "";
  return appApiRequest<ListResponse<Company>>(`/companies${search}`);
}

export async function listDealsApi(query?: { q?: string }): Promise<ListResponse<Deal>> {
  const search = query?.q ? `?q=${encodeURIComponent(query.q)}` : "";
  return appApiRequest<ListResponse<Deal>>(`/deals${search}`);
}

export async function listTasksApi(): Promise<ListResponse<Task>> {
  return appApiRequest<ListResponse<Task>>("/tasks");
}

export async function listActivitiesApi(): Promise<ListResponse<Activity>> {
  return appApiRequest<ListResponse<Activity>>("/activities");
}
