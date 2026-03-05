import { INVOICE_STATUS_VALUES, type InvoiceStatus, type MembershipRole } from "@/lib/crm-types";

type ValidationIssue = { path: string; message: string };

type SafeParseSuccess<T> = {
  success: true;
  data: T;
};

type SafeParseFailure = {
  success: false;
  error: {
    issues: ValidationIssue[];
  };
};

export type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseFailure;

export type Schema<T> = {
  parse: (input: unknown) => T;
  safeParse: (input: unknown) => SafeParseResult<T>;
};

function makeSchema<T>(validate: (input: unknown) => { data?: T; issues: ValidationIssue[] }): Schema<T> {
  return {
    parse(input) {
      const result = validate(input);
      if (result.issues.length > 0 || result.data === undefined) {
        const message = result.issues.map((issue) => `${issue.path}: ${issue.message}`).join(", ");
        throw new Error(message || "Validation failed");
      }
      return result.data;
    },
    safeParse(input) {
      const result = validate(input);
      if (result.issues.length > 0 || result.data === undefined) {
        return { success: false, error: { issues: result.issues } };
      }
      return { success: true, data: result.data };
    }
  };
}

function asObject(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  return input as Record<string, unknown>;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readRequiredString(
  source: Record<string, unknown>,
  key: string,
  issues: ValidationIssue[],
  options: { minLength?: number; pattern?: RegExp; message?: string } = {}
): string {
  const value = source[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push({ path: key, message: "Required" });
    return "";
  }

  if (options.minLength && value.length < options.minLength) {
    issues.push({ path: key, message: `Must be at least ${options.minLength} characters` });
  }

  if (options.pattern && !options.pattern.test(value)) {
    issues.push({ path: key, message: options.message ?? "Invalid format" });
  }

  return value;
}

function readOptionalString(source: Record<string, unknown>, key: string, issues: ValidationIssue[]): string | undefined {
  const value = source[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    issues.push({ path: key, message: "Must be a string" });
    return undefined;
  }
  return value;
}

function readRequiredNumber(source: Record<string, unknown>, key: string, issues: ValidationIssue[]): number {
  const value = source[key];
  if (typeof value !== "number" || Number.isNaN(value)) {
    issues.push({ path: key, message: "Must be a number" });
    return 0;
  }
  return value;
}

function readOptionalNumber(source: Record<string, unknown>, key: string, issues: ValidationIssue[]): number | undefined {
  const value = source[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "number" || Number.isNaN(value)) {
    issues.push({ path: key, message: "Must be a number" });
    return undefined;
  }
  return value;
}

function readOptionalStringArray(
  source: Record<string, unknown>,
  key: string,
  issues: ValidationIssue[]
): string[] | undefined {
  const value = source[key];
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    issues.push({ path: key, message: "Must be an array of strings" });
    return undefined;
  }
  return value as string[];
}

function ensureEnum<T extends string>(
  value: unknown,
  values: readonly T[],
  key: string,
  issues: ValidationIssue[],
  required = true
): T | undefined {
  if (value === undefined || value === null || value === "") {
    if (required) issues.push({ path: key, message: "Required" });
    return undefined;
  }
  if (typeof value !== "string" || !(values as readonly string[]).includes(value)) {
    issues.push({ path: key, message: `Must be one of: ${values.join(", ")}` });
    return undefined;
  }
  return value as T;
}

export const signUpSchema = makeSchema<{ name: string; email: string; password: string }>((input) => {
  const issues: ValidationIssue[] = [];
  const body = asObject(input);
  if (!body) return { issues: [{ path: "body", message: "Must be an object" }] };

  const name = readRequiredString(body, "name", issues);
  const email = readRequiredString(body, "email", issues);
  const password = readRequiredString(body, "password", issues, { minLength: 8 });

  if (email && !isEmail(email)) issues.push({ path: "email", message: "Invalid email address" });

  return { data: { name, email, password }, issues };
});

export const signInSchema = makeSchema<{ email: string; password: string }>((input) => {
  const issues: ValidationIssue[] = [];
  const body = asObject(input);
  if (!body) return { issues: [{ path: "body", message: "Must be an object" }] };

  const email = readRequiredString(body, "email", issues);
  const password = readRequiredString(body, "password", issues, { minLength: 8 });
  if (email && !isEmail(email)) issues.push({ path: "email", message: "Invalid email address" });

  return { data: { email, password }, issues };
});

export const workspaceSchema = makeSchema<{ name: string; slug: string }>((input) => {
  const issues: ValidationIssue[] = [];
  const body = asObject(input);
  if (!body) return { issues: [{ path: "body", message: "Must be an object" }] };

  const name = readRequiredString(body, "name", issues);
  const slug = readRequiredString(body, "slug", issues, {
    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    message: "Must be lowercase and hyphenated"
  });

  return { data: { name, slug }, issues };
});

const MEMBERSHIP_ROLE_VALUES: MembershipRole[] = ["OWNER", "ADMIN", "MEMBER"];

export const inviteSchema = makeSchema<{ email: string; role: MembershipRole }>((input) => {
  const issues: ValidationIssue[] = [];
  const body = asObject(input);
  if (!body) return { issues: [{ path: "body", message: "Must be an object" }] };

  const email = readRequiredString(body, "email", issues);
  const role = ensureEnum(body.role, MEMBERSHIP_ROLE_VALUES, "role", issues) ?? "MEMBER";
  if (email && !isEmail(email)) issues.push({ path: "email", message: "Invalid email address" });

  return { data: { email, role }, issues };
});

export const stageSchema = makeSchema<{ name: string; order: number }>((input) => {
  const issues: ValidationIssue[] = [];
  const body = asObject(input);
  if (!body) return { issues: [{ path: "body", message: "Must be an object" }] };

  const name = readRequiredString(body, "name", issues);
  const order = readRequiredNumber(body, "order", issues);

  if (!Number.isInteger(order) || order < 1) {
    issues.push({ path: "order", message: "Must be an integer greater than or equal to 1" });
  }

  return { data: { name, order }, issues };
});

export const contactSchema = makeSchema<{
  firstName: string;
  lastName: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  companyId?: string;
  customerType?: "B2B" | "B2C" | "PATIENT";
  tags?: string[];
}>((input) => {
  const issues: ValidationIssue[] = [];
  const body = asObject(input);
  if (!body) return { issues: [{ path: "body", message: "Must be an object" }] };

  const firstName = readRequiredString(body, "firstName", issues);
  const lastName = readRequiredString(body, "lastName", issues);
  const jobTitle = readOptionalString(body, "jobTitle", issues);
  const email = readOptionalString(body, "email", issues);
  const phone = readOptionalString(body, "phone", issues);
  const companyId = readOptionalString(body, "companyId", issues);
  const customerType = ensureEnum(body.customerType, ["B2B", "B2C", "PATIENT"] as const, "customerType", issues, false);
  const tags = readOptionalStringArray(body, "tags", issues);

  if (email && !isEmail(email)) {
    issues.push({ path: "email", message: "Invalid email address" });
  }

  return { data: { firstName, lastName, jobTitle, email, phone, companyId, customerType, tags }, issues };
});

export const companySchema = makeSchema<{
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
}>((input) => {
  const issues: ValidationIssue[] = [];
  const body = asObject(input);
  if (!body) return { issues: [{ path: "body", message: "Must be an object" }] };

  const name = readRequiredString(body, "name", issues);
  const domain = readOptionalString(body, "domain", issues);
  const industry = readOptionalString(body, "industry", issues);
  const size = readOptionalString(body, "size", issues);

  return { data: { name, domain, industry, size }, issues };
});

const DEAL_STATUS_VALUES = ["OPEN", "WON", "LOST"] as const;

export const dealSchema = makeSchema<{
  title: string;
  amount: number;
  currency: string;
  stageId: string;
  companyId?: string;
  primaryContactId?: string;
  expectedCloseDate?: string;
  status?: "OPEN" | "WON" | "LOST";
  description?: string;
}>((input) => {
  const issues: ValidationIssue[] = [];
  const body = asObject(input);
  if (!body) return { issues: [{ path: "body", message: "Must be an object" }] };

  const title = readRequiredString(body, "title", issues);
  const amount = readRequiredNumber(body, "amount", issues);
  const currency = readRequiredString(body, "currency", issues);
  const stageId = readRequiredString(body, "stageId", issues);
  const companyId = readOptionalString(body, "companyId", issues);
  const primaryContactId = readOptionalString(body, "primaryContactId", issues);
  const expectedCloseDate = readOptionalString(body, "expectedCloseDate", issues);
  const status = ensureEnum(body.status, DEAL_STATUS_VALUES, "status", issues, false);
  const description = readOptionalString(body, "description", issues);

  return {
    data: {
      title,
      amount,
      currency,
      stageId,
      companyId,
      primaryContactId,
      expectedCloseDate,
      status,
      description
    },
    issues
  };
});

export const dealPatchSchema = makeSchema<{
  title?: string;
  amount?: number;
  currency?: string;
  stageId?: string;
  companyId?: string;
  primaryContactId?: string;
  expectedCloseDate?: string;
  status?: "OPEN" | "WON" | "LOST";
  description?: string;
}>((input) => {
  const issues: ValidationIssue[] = [];
  const body = asObject(input);
  if (!body) return { issues: [{ path: "body", message: "Must be an object" }] };

  const title = readOptionalString(body, "title", issues);
  const amount = readOptionalNumber(body, "amount", issues);
  const currency = readOptionalString(body, "currency", issues);
  const stageId = readOptionalString(body, "stageId", issues);
  const companyId = readOptionalString(body, "companyId", issues);
  const primaryContactId = readOptionalString(body, "primaryContactId", issues);
  const expectedCloseDate = readOptionalString(body, "expectedCloseDate", issues);
  const status = ensureEnum(body.status, DEAL_STATUS_VALUES, "status", issues, false);
  const description = readOptionalString(body, "description", issues);

  return {
    data: {
      title,
      amount,
      currency,
      stageId,
      companyId,
      primaryContactId,
      expectedCloseDate,
      status,
      description
    },
    issues
  };
});

export const taskSchema = makeSchema<{
  title: string;
  dueAt?: string;
  assigneeId?: string;
  relatedType: "contact" | "company" | "deal" | "task";
  relatedId: string;
}>((input) => {
  const issues: ValidationIssue[] = [];
  const body = asObject(input);
  if (!body) return { issues: [{ path: "body", message: "Must be an object" }] };

  const title = readRequiredString(body, "title", issues);
  const dueAt = readOptionalString(body, "dueAt", issues);
  const assigneeId = readOptionalString(body, "assigneeId", issues);
  const relatedType = ensureEnum(body.relatedType, ["contact", "company", "deal", "task"] as const, "relatedType", issues) ?? "contact";
  const relatedId = readRequiredString(body, "relatedId", issues);

  return { data: { title, dueAt, assigneeId, relatedType, relatedId }, issues };
});

export const noteSchema = makeSchema<{
  body: string;
  relatedType: "contact" | "company" | "deal" | "task";
  relatedId: string;
}>((input) => {
  const issues: ValidationIssue[] = [];
  const source = asObject(input);
  if (!source) return { issues: [{ path: "body", message: "Must be an object" }] };

  const body = readRequiredString(source, "body", issues);
  const relatedType = ensureEnum(source.relatedType, ["contact", "company", "deal", "task"] as const, "relatedType", issues) ?? "contact";
  const relatedId = readRequiredString(source, "relatedId", issues);

  return { data: { body, relatedType, relatedId }, issues };
});

export const invoiceSchema = makeSchema<{
  invoiceNumber: string;
  title: string;
  relatedType: "contact" | "company";
  relatedId: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt?: string;
  dueAt?: string;
  notes?: string;
}>((input) => {
  const issues: ValidationIssue[] = [];
  const body = asObject(input);
  if (!body) return { issues: [{ path: "body", message: "Must be an object" }] };

  const invoiceNumber = readRequiredString(body, "invoiceNumber", issues);
  const title = readRequiredString(body, "title", issues);
  const relatedType = ensureEnum(body.relatedType, ["contact", "company"] as const, "relatedType", issues) ?? "contact";
  const relatedId = readRequiredString(body, "relatedId", issues);
  const amount = readRequiredNumber(body, "amount", issues);
  const currency = readRequiredString(body, "currency", issues);
  const status = ensureEnum(body.status, INVOICE_STATUS_VALUES, "status", issues) ?? "DRAFT";
  const issuedAt = readOptionalString(body, "issuedAt", issues);
  const dueAt = readOptionalString(body, "dueAt", issues);
  const notes = readOptionalString(body, "notes", issues);

  return {
    data: {
      invoiceNumber,
      title,
      relatedType,
      relatedId,
      amount,
      currency,
      status,
      issuedAt,
      dueAt,
      notes
    },
    issues
  };
});

export const taskStatusSchema = makeSchema<{ status: "OPEN" | "DONE" }>((input) => {
  const issues: ValidationIssue[] = [];
  const body = asObject(input);
  if (!body) return { issues: [{ path: "body", message: "Must be an object" }] };

  const status = ensureEnum(body.status, ["OPEN", "DONE"] as const, "status", issues) ?? "OPEN";
  return { data: { status }, issues };
});
