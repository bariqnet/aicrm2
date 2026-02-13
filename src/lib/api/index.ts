import { activities, companies, deals, people, stages, tasks } from "@/lib/api/mock";
import { Activity, Company, Deal, Person, Task } from "@/lib/types";

const useMock = process.env.USE_MOCK_DATA !== "false";
const delay = async () => new Promise((r) => setTimeout(r, 120));
const shouldThrow = () => Math.random() < 0.03;

type Query = { q?: string; page?: number; pageSize?: number };

function paginate<T>(rows: T[], page = 1, pageSize = 20) {
  const start = (page - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), total: rows.length };
}

export async function listPeople(query: Query = {}) {
  if (!useMock) return { rows: [] as Person[], total: 0 };
  await delay();
  if (shouldThrow()) throw new Error("Mock people fetch failed");
  const filtered = people.filter((p) => !query.q || p.name.toLowerCase().includes(query.q.toLowerCase()));
  return paginate(filtered, query.page, query.pageSize);
}

export const listCompanies = async (q: Query = {}) => paginate(companies.filter((c) => !q.q || c.name.toLowerCase().includes(q.q.toLowerCase())), q.page, q.pageSize);
export const listDeals = async () => ({ rows: deals, total: deals.length, stages });
export const listTasks = async () => ({ rows: tasks, total: tasks.length });
export const listActivities = async () => ({ rows: activities, total: activities.length });

export const getPerson = async (id: string) => people.find((x) => x.id === id) ?? null;
export const getCompany = async (id: string) => companies.find((x) => x.id === id) ?? null;
export const getDeal = async (id: string) => deals.find((x) => x.id === id) ?? null;

export const createPerson = async (data: Omit<Person, "id" | "createdAt" | "lastTouchAt">) => {
  const person: Person = { ...data, id: `p${people.length + 1}`, createdAt: new Date().toISOString(), lastTouchAt: new Date().toISOString() };
  people.unshift(person);
  return person;
};

export const createCompany = async (data: Omit<Company, "id" | "createdAt" | "lastTouchAt">) => {
  const company: Company = { ...data, id: `c${companies.length + 1}`, createdAt: new Date().toISOString(), lastTouchAt: new Date().toISOString() };
  companies.unshift(company);
  return company;
};

export const createDeal = async (data: Omit<Deal, "id" | "createdAt" | "lastTouchAt">) => {
  const deal: Deal = { ...data, id: `d${deals.length + 1}`, createdAt: new Date().toISOString(), lastTouchAt: new Date().toISOString() };
  deals.unshift(deal);
  return deal;
};

export const toggleTask = async (id: string) => {
  const task = tasks.find((t) => t.id === id);
  if (task) task.status = task.status === "open" ? "done" : "open";
  return task as Task;
};

export const timelineFor = async (relatedType: Activity["relatedType"], relatedId: string) =>
  activities.filter((a) => a.relatedType === relatedType && a.relatedId === relatedId);
