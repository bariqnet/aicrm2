# AI CRM Backend Handoff Document

Date: 2026-02-15  
Owner: Frontend Team  
Audience: Backend Team

## 1. Objective

This document defines the backend contract required to move the current AI CRM frontend from scaffold mode to production-ready behavior.

Primary goals:

1. Replace mock/in-memory behavior with real persistent APIs.
2. Enforce secure auth, workspace isolation, and role-based access.
3. Support full CRM operations for contacts, companies, deals, tasks, notes, activities, invoices, visits, onboarding, reporting, and global search.

## 2. Deliverables Requested From Backend Team

1. Implement the API contract in `openapi/crm.openapi.yaml`.
2. Provide production database models and migrations for all entities in Section 5.
3. Enforce authentication and authorization (RBAC + workspace scoping).
4. Provide stable pagination/filtering semantics for list endpoints.
5. Provide error handling format compatible with frontend parsing rules.
6. Provide staging environment URL and test credentials/workspace.

## 3. Contract Artifacts

1. OpenAPI contract (source of truth): `openapi/crm.openapi.yaml`
2. This handoff guide (implementation notes): `docs/backend-handoff.md`

## 4. Global API Standards

## 4.1 Base URL

Use a single base URL (example):

`https://api.company.com/v1`

## 4.2 Authentication

1. Use `Authorization: Bearer <access_token>`.
2. Auth endpoints:
   1. `POST /auth/register`
   2. `POST /auth/login`
   3. `POST /auth/logout`
   4. `GET /auth/me`
   5. `POST /auth/refresh` (recommended)

## 4.3 Workspace Context

1. Workspace must be derived from token and/or explicit switch endpoint.
2. `POST /workspaces/switch` must return updated auth/session context.
3. Optional: accept `X-Workspace-Id` if user has membership.

## 4.4 Content Type

1. Request: `application/json` unless export endpoint.
2. Response: `application/json` unless CSV export.

## 4.5 Date and Time Format

1. Use ISO-8601 UTC for date-time fields (`createdAt`, `updatedAt`, etc.).
2. For visit scheduling:
   1. `date`: `YYYY-MM-DD`
   2. `time`: `HH:mm`

## 4.6 List Response Envelope

List endpoints must return:

```json
{
  "rows": [],
  "total": 0,
  "nextCursor": null
}
```

`nextCursor` can be omitted when not using cursor pagination, but `rows` and `total` are required.

## 4.7 Error Response Envelope

Use:

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "issues": [
    { "path": "email", "message": "Invalid email" }
  ]
}
```

Status codes expected:

1. `400` validation/invalid request
2. `401` unauthenticated
3. `403` forbidden
4. `404` not found
5. `409` conflict
6. `422` business rule violation
7. `429` rate limited
8. `500` internal error

## 5. Canonical Data Models

```ts
type MembershipRole = "OWNER" | "ADMIN" | "MEMBER";
type CustomerType = "B2B" | "B2C" | "PATIENT";
type DealStatus = "OPEN" | "WON" | "LOST";
type TaskStatus = "OPEN" | "DONE";
type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "VOID";
type VisitStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

type Workspace = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

type Membership = {
  id: string;
  workspaceId: string;
  userId: string;
  role: MembershipRole;
  createdAt: string;
};

type Invite = {
  id: string;
  workspaceId: string;
  email: string;
  role: MembershipRole;
  token: string;
  expiresAt: string;
  acceptedAt?: string | null;
};

type Stage = {
  id: string;
  workspaceId: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

type Company = {
  id: string;
  workspaceId: string;
  ownerId: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  size?: string | null;
  createdAt: string;
  updatedAt: string;
};

type Contact = {
  id: string;
  workspaceId: string;
  ownerId: string;
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  companyId?: string | null;
  customerType?: CustomerType | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

type Deal = {
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
  createdAt: string;
  updatedAt: string;
};

type Task = {
  id: string;
  workspaceId: string;
  createdById: string;
  assigneeId?: string | null;
  title: string;
  dueAt?: string | null;
  status: TaskStatus;
  relatedType: "contact" | "company" | "deal" | "task";
  relatedId: string;
  createdAt: string;
  updatedAt: string;
};

type Note = {
  id: string;
  workspaceId: string;
  authorId: string;
  body: string;
  relatedType: "contact" | "company" | "deal" | "task";
  relatedId: string;
  createdAt: string;
  updatedAt: string;
};

type Activity = {
  id: string;
  workspaceId: string;
  actorId: string;
  type: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

type Invoice = {
  id: string;
  workspaceId: string;
  createdById: string | null;
  invoiceNumber: string;
  title: string;
  notes?: string | null;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  relatedType?: "contact" | "company" | null;
  relatedId?: string | null;
  issuedAt?: string | null;
  dueAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type Visit = {
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
  updatedAt: string;
};
```

## 6. Endpoint Matrix (Full Scope)

## 6.1 Auth

1. `POST /auth/register`
2. `POST /auth/login`
3. `POST /auth/logout`
4. `GET /auth/me`
5. `POST /auth/refresh`

Auth response used by frontend session must include:

```json
{
  "token": "string",
  "user": { "id": "string", "name": "string", "email": "string" },
  "workspaceId": "string"
}
```

## 6.2 Workspaces and Access

1. `GET /workspaces`
2. `POST /workspaces`
3. `POST /workspaces/switch`
4. `GET /memberships`
5. `PATCH /memberships/{id}`
6. `DELETE /memberships/{id}`
7. `GET /users`
8. `GET /invites`
9. `POST /invites`
10. `POST /invites/accept`
11. `DELETE /invites/{id}`

## 6.3 Stages

1. `GET /stages`
2. `POST /stages`
3. `PATCH /stages/{id}`
4. `DELETE /stages/{id}`
5. `PUT /stages/reorder`

## 6.4 Contacts

1. `GET /contacts`
2. `POST /contacts`
3. `GET /contacts/{id}`
4. `PATCH /contacts/{id}`
5. `DELETE /contacts/{id}`
6. `POST /contacts/import`
7. `GET /contacts/export?format=csv`
8. `POST /contacts/bulk-delete`

## 6.5 Companies

1. `GET /companies`
2. `POST /companies`
3. `GET /companies/{id}`
4. `PATCH /companies/{id}`
5. `DELETE /companies/{id}`

## 6.6 Deals

1. `GET /deals`
2. `POST /deals`
3. `GET /deals/{id}`
4. `PATCH /deals/{id}`
5. `DELETE /deals/{id}`

## 6.7 Tasks

1. `GET /tasks`
2. `POST /tasks`
3. `GET /tasks/{id}`
4. `PATCH /tasks/{id}`
5. `DELETE /tasks/{id}`

## 6.8 Notes

1. `GET /notes?relatedType=&relatedId=`
2. `POST /notes`
3. `DELETE /notes/{id}`

## 6.9 Activities

1. `GET /activities?entityType=&entityId=&dateFrom=&dateTo=`

## 6.10 Invoices

1. `GET /invoices`
2. `POST /invoices`
3. `GET /invoices/{id}`
4. `PATCH /invoices/{id}`
5. `DELETE /invoices/{id}`

## 6.11 Visits

1. `GET /visits`
2. `POST /visits`
3. `PATCH /visits/{id}`
4. `DELETE /visits/{id}`

## 6.12 Reports and Search

1. `GET /reports/dashboard`
2. `GET /reports/pipeline`
3. `GET /reports/invoice-aging`
4. `GET /search?q=...`

## 7. Field/Enum Compatibility Requirements

Strict enum values expected by frontend:

1. Deal status: `OPEN`, `WON`, `LOST`
2. Task status: `OPEN`, `DONE`
3. Invoice status: `DRAFT`, `SENT`, `PAID`, `OVERDUE`, `VOID`
4. Membership role: `OWNER`, `ADMIN`, `MEMBER`
5. Visit status: `SCHEDULED`, `COMPLETED`, `CANCELLED`
6. Related type: `contact`, `company`, `deal`, `task`
7. Customer type: `B2B`, `B2C`, `PATIENT`

## 8. Business Rules and Access Control

1. Every resource must be workspace-scoped.
2. User must only read/write records from workspaces they belong to.
3. Owner/Admin-only operations:
   1. Manage memberships/invites
   2. Create/update/delete/reorder stages
   3. Workspace-level settings actions
4. Stage deletion should be blocked if active deals reference stage unless migration target stage is provided.
5. Deleting company/contact/deal/task should enforce referential strategy (block, nullify, or cascade) consistently.

## 9. Data Integrity Constraints

1. Unique:
   1. Workspace slug (global)
   2. Invoice number within workspace
2. Indexing:
   1. `(workspaceId, createdAt)` on all primary entities
   2. `(workspaceId, stageId)` for deals
   3. `(workspaceId, relatedType, relatedId)` for tasks/notes/activities
3. Soft-delete recommended for audit-sensitive entities (contacts, companies, deals, invoices).

## 10. Pagination, Filtering, and Sorting

1. Cursor-based pagination preferred for large datasets.
2. Include stable sorting defaults:
   1. Contacts/companies: `updatedAt desc`
   2. Deals: `updatedAt desc`
   3. Tasks: `dueAt asc`, then `createdAt desc`
3. Filters requested for initial implementation:
   1. Contacts: `q`, `companyId`, `customerType`, `tag`
   2. Deals: `q`, `stageId`, `status`, `ownerId`
   3. Tasks: `status`, `assigneeId`, `relatedType`, `relatedId`
   4. Invoices: `status`, `relatedType`, `relatedId`, `date ranges`

## 11. Reporting Payload Expectations

## 11.1 `/reports/dashboard`

```json
{
  "openDeals": 12,
  "openTasks": 27,
  "pipelineTotal": 425000,
  "recentActivity": 54
}
```

## 11.2 `/reports/pipeline`

```json
{
  "stages": [
    { "stageId": "stage_lead", "stageName": "Lead", "openDeals": 5, "totalAmount": 100000 }
  ],
  "totalOpenDeals": 12,
  "totalPipelineAmount": 425000
}
```

## 11.3 `/reports/invoice-aging`

```json
{
  "buckets": [
    { "bucket": "current", "count": 4, "amount": 12000 },
    { "bucket": "days_1_30", "count": 2, "amount": 4100 }
  ],
  "totalOutstanding": 16100
}
```

## 12. Performance and Reliability Requirements

1. P95 for list/read endpoints: <= 400ms under normal load.
2. P95 for create/update/delete endpoints: <= 600ms.
3. Availability target: 99.9% for production.
4. Structured logs with request IDs.
5. Rate limiting and abuse protection on auth and import endpoints.

## 13. Security Requirements

1. JWT validation and expiration enforcement.
2. Refresh token rotation (if refresh flow is enabled).
3. Password hashing with strong algorithm (Argon2 or bcrypt with current cost policy).
4. Input validation server-side for all payloads.
5. Audit trail for sensitive actions (role changes, stage changes, invoice status changes).

## 14. Priority Plan

## P0 (must-have to unblock current product)

1. Auth endpoints and secure workspace context.
2. Workspaces/memberships/users/invites real implementation.
3. Full CRUD for contacts, companies, deals, tasks.
4. Notes and activities list/create support.
5. Stages create/update/reorder/delete.
6. Invoices and visits CRUD.

## P1 (high value right after P0)

1. Reports endpoints.
2. Global search endpoint.
3. CSV import/export hardening.
4. Bulk delete.

## P2 (optimization)

1. Webhooks/event streaming.
2. Advanced analytics aggregations.
3. Data retention and archive tools.

## 15. Acceptance Criteria (Definition of Done)

Backend delivery is accepted when:

1. All endpoints in Section 6 are implemented and documented.
2. OpenAPI spec is updated to match implementation and passes lint/validation.
3. RBAC and workspace isolation verified in integration tests.
4. Frontend can run end-to-end with no mock/in-memory fallbacks.
5. Seed/staging data and credentials are provided for QA.
6. Error and list response contracts match Section 4.

## 16. Open Questions for Backend Team

Please confirm:

1. Token strategy: JWT only, or JWT + refresh token?
2. Soft-delete vs hard-delete policy per entity.
3. Search backend: DB-native or dedicated engine.
4. Invoice numbering strategy (manual vs auto-generated).
5. Activity logging: server-generated only or mixed client/server events.

## 17. Immediate Next Step

Backend team should start from:

1. `openapi/crm.openapi.yaml` as implementation contract
2. Section 14 P0 list as sprint scope

