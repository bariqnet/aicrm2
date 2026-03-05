# AI CRM2 Mobile Handoff (Flutter + Riverpod)

Date: 2026-03-04
Audience: Mobile team (Flutter)
Goal: Build a Flutter app with Riverpod that matches current web app behavior.

## 1) Project Summary

This project is a CRM web app built with:

- Next.js App Router (v15)
- React 19 + TypeScript
- Tailwind CSS
- Zustand (UI-only local state)
- Server-side API calls through Next API routes (`/api/*`) that proxy to an external backend

Core business modules:

- Authentication + session
- Workspace and membership management
- Onboarding (workspace, pipeline stages, invites)
- Contacts
- Companies
- Deals (kanban pipeline)
- Tasks
- Notes + activity timeline
- Invoices (including print view)
- Visits + calendar
- Reminders + notifications (API is present)
- AI relationship intelligence for contact/company profiles

Current UI language support:

- English + Arabic

## 2) Architecture You Need To Mirror In Flutter

### 2.1 Backend topology

The web app calls an external backend at:

- `https://t8xizhkeq6.execute-api.us-east-1.amazonaws.com/dev`

In web, most pages call `"/api/..."` and Next.js proxies to backend.

For mobile, call backend directly (recommended):

- `https://t8xizhkeq6.execute-api.us-east-1.amazonaws.com/dev/<endpoint>`

### 2.2 Auth/session model

Web flow:

1. Sign in/up against backend (`/auth/login`, `/auth/register`)
2. Persist token/user into Next cookie via `POST /api/session`
3. All later `/api/*` requests forward bearer token + workspace id from cookie

Mobile flow should be:

1. Sign in/up directly against backend
2. Store token + refreshToken + user + workspaceId in secure storage
3. Add `Authorization: Bearer <token>` on all protected calls
4. Add `X-Workspace-Id: <workspaceId>` when available
5. On `401`, call refresh endpoint then retry

### 2.3 Global response patterns

List responses usually:

```json
{
  "rows": [],
  "total": 0,
  "nextCursor": null
}
```

Error responses usually:

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "issues": [
    { "path": "email", "message": "Invalid email" }
  ]
}
```

## 3) Enums Used In App

- `MembershipRole`: `OWNER | ADMIN | MEMBER`
- `CustomerType`: `B2B | B2C | PATIENT`
- `DealStatus`: `OPEN | WON | LOST`
- `TaskStatus`: `OPEN | DONE`
- `InvoiceStatus`: `DRAFT | SENT | PARTIALLY_PAID | PAID | OVERDUE | VOID`
- `VisitStatus`: `SCHEDULED | COMPLETED | CANCELLED`
- `ReminderStatus`: `PENDING | SENT | CANCELLED | FAILED`
- `ReminderPriority`: `LOW | MEDIUM | HIGH`
- `NotificationStatus`: `UNREAD | READ | ARCHIVED`
- `DeliveryChannel`: `IN_APP | EMAIL | SMS`
- `RelatedType` in tasks/notes: `contact | company | deal | task`

## 4) API Map (Web Proxy -> Backend)

- `POST /api/auth/sign-up` -> `POST /auth/register`
- `POST /api/auth/sign-in` -> `POST /auth/login`
- `POST /api/auth/refresh` -> `POST /auth/refresh`
- `GET /api/auth/me` -> `GET /auth/me`
- `POST /api/auth/sign-out` -> `POST /auth/logout`

- `GET/POST /api/workspaces` -> `GET/POST /workspaces`
- `POST /api/workspaces/switch` -> `POST /workspaces/switch`

- `GET /api/memberships` -> `GET /memberships`
- `PATCH/DELETE /api/memberships/{id}` -> `PATCH/DELETE /memberships/{id}`
- `GET /api/users` -> `GET /users`

- `GET/POST /api/invites` -> `GET/POST /invites`
- `DELETE /api/invites/{id}` -> `DELETE /invites/{id}`
- `POST /api/invites/accept` -> `POST /invites/accept`

- `GET/POST /api/stages` -> `GET/POST /stages`
- `PATCH/DELETE /api/stages/{id}` -> `PATCH/DELETE /stages/{id}`
- `PUT /api/stages/reorder` -> `PUT /stages/reorder`

- `GET/POST /api/contacts` -> `GET/POST /contacts`
- `GET/PATCH/DELETE /api/contacts/{id}` -> `GET/PATCH/DELETE /contacts/{id}`
- `POST /api/contacts/import` -> `POST /contacts/import`
- `GET /api/contacts/export` -> `GET /contacts/export`
- `POST /api/contacts/bulk-delete` -> `POST /contacts/bulk-delete`

- `GET/POST /api/companies` -> `GET/POST /companies`
- `GET/PATCH/DELETE /api/companies/{id}` -> `GET/PATCH/DELETE /companies/{id}`

- `GET/POST /api/deals` -> `GET/POST /deals`
- `GET/PATCH/DELETE /api/deals/{id}` -> `GET/PATCH/DELETE /deals/{id}`

- `GET/POST /api/tasks` -> `GET/POST /tasks`
- `GET/PATCH/DELETE /api/tasks/{id}` -> `GET/PATCH/DELETE /tasks/{id}`

- `GET/POST /api/notes` -> `GET/POST /notes`
- `DELETE /api/notes/{id}` -> `DELETE /notes/{id}`

- `GET /api/activities` -> `GET /activities`

- `GET/POST /api/invoices` -> `GET/POST /invoices`
- `GET/PATCH/DELETE /api/invoices/{id}` -> `GET/PATCH/DELETE /invoices/{id}`

- `GET/POST /api/visits` -> `GET/POST /visits`
- `GET/PATCH/DELETE /api/visits/{id}` -> `GET/PATCH/DELETE /visits/{id}`

- `GET/POST /api/reminders` -> `GET/POST /reminders`
- `GET/PATCH/DELETE /api/reminders/{id}` -> `GET/PATCH/DELETE /reminders/{id}`

- `GET /api/notifications` -> `GET /notifications`
- `PATCH/DELETE /api/notifications/{id}` -> `PATCH/DELETE /notifications/{id}`
- `POST /api/notifications/mark-all-read` -> `POST /notifications/mark-all-read`

- `POST /api/onboarding/workspace` -> `POST /onboarding/workspace`
- `POST /api/onboarding/stages` -> `POST /onboarding/stages`
- `POST /api/onboarding/invites` -> `POST /onboarding/invites`

- `POST /api/ai/relationship-intelligence` -> Internal Next AI endpoint (not proxied)
- `POST /api/session`, `DELETE /api/session` -> Web-only cookie session endpoints

## 5) Request/Response Examples By Module

## 5.1 Auth

### Register

`POST /auth/register`

Request:

```json
{
  "name": "Jane Owner",
  "email": "jane.owner@crm.local",
  "password": "OwnerPass123!",
  "inviteToken": null
}
```

Response (`200`/`201` depending backend):

```json
{
  "token": "<jwt>",
  "refreshToken": "<refresh>",
  "user": {
    "id": "65fb00112233445566778899",
    "name": "Jane Owner",
    "email": "jane.owner@crm.local"
  },
  "workspaceId": "65fb00112233445566770011"
}
```

### Login

`POST /auth/login`

Request:

```json
{
  "email": "jane.owner@crm.local",
  "password": "OwnerPass123!"
}
```

Response: same as register.

### Me

`GET /auth/me`

Response:

```json
{
  "user": {
    "id": "65fb00112233445566778899",
    "name": "Jane Owner",
    "email": "jane.owner@crm.local",
    "createdAt": "2026-03-01T08:00:00.000Z",
    "updatedAt": "2026-03-01T08:00:00.000Z"
  },
  "workspaceId": "65fb00112233445566770011",
  "role": "OWNER"
}
```

### Refresh

`POST /auth/refresh`

Request:

```json
{
  "refreshToken": "<refresh>"
}
```

Response: same shape as login.

### Logout

`POST /auth/logout`

Request:

```json
{
  "refreshToken": "<refresh>"
}
```

Response:

```json
{
  "ok": true
}
```

## 5.2 Web-only Session API (not for direct mobile use)

### Persist session cookie

`POST /api/session`

Request:

```json
{
  "token": "<jwt>",
  "user": {
    "id": "65fb00112233445566778899",
    "name": "Jane Owner",
    "email": "jane.owner@crm.local"
  },
  "workspaceId": "65fb00112233445566770011"
}
```

Response:

```json
{
  "ok": true
}
```

### Clear session cookie

`DELETE /api/session`

Response:

```json
{
  "ok": true
}
```

## 5.3 Workspaces / Access

### List workspaces

`GET /workspaces`

Response:

```json
{
  "rows": [
    {
      "id": "65fb00112233445566770011",
      "name": "Jane Workspace",
      "slug": "jane-workspace",
      "createdAt": "2026-03-01T08:00:00.000Z",
      "updatedAt": "2026-03-01T08:00:00.000Z"
    }
  ],
  "total": 1,
  "nextCursor": null
}
```

### Create workspace

`POST /workspaces`

```json
{
  "name": "Medical Sales",
  "slug": "medical-sales"
}
```

### Switch workspace

`POST /workspaces/switch`

```json
{
  "workspaceId": "65fb00112233445566770012"
}
```

Response: new auth token payload.

### Memberships

- `GET /memberships`
- `PATCH /memberships/{id}` with `{ "role": "ADMIN" }`
- `DELETE /memberships/{id}`

### Users

- `GET /users`

### Invites

- `GET /invites`
- `POST /invites` with `{ "email": "new.user@crm.local", "role": "MEMBER" }`
- `DELETE /invites/{id}`
- `POST /invites/accept` with `{ "token": "<invite-token>" }`

## 5.4 Onboarding endpoints

These are available in web and used as first attempt:

### Workspace setup

`POST /onboarding/workspace`

```json
{
  "name": "Medical Sales",
  "slug": "medical-sales",
  "crmTypeId": "software-company"
}
```

### Stage setup

`POST /onboarding/stages`

```json
{
  "crmTypeId": "software-company",
  "stages": [
    { "name": "Lead", "order": 1 },
    { "name": "Qualified", "order": 2 }
  ]
}
```

### Invite setup

`POST /onboarding/invites`

```json
{
  "invites": [
    { "email": "member@crm.local", "role": "MEMBER" }
  ]
}
```

Mobile fallback if onboarding endpoints are unavailable:

1. `POST /workspaces`
2. `POST /workspaces/switch`
3. `POST /stages` / `PATCH /stages/{id}`
4. `POST /invites`

## 5.5 Stages

### List

`GET /stages`

### Create

`POST /stages`

```json
{
  "name": "Proposal",
  "order": 3
}
```

### Update

`PATCH /stages/{id}`

```json
{
  "name": "Negotiation",
  "order": 4
}
```

### Reorder

`PUT /stages/reorder`

```json
{
  "stages": [
    { "id": "stage_1", "order": 1 },
    { "id": "stage_2", "order": 2 }
  ]
}
```

### Delete

`DELETE /stages/{id}`

## 5.6 Contacts

### List

`GET /contacts?q=jane&companyId=65fb...&customerType=B2B&tag=priority&limit=20`

### Create

`POST /contacts`

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "jobTitle": "Procurement Manager",
  "email": "jane.doe@acme.com",
  "phone": "+1-555-1000",
  "companyId": "65fb00112233445566773001",
  "customerType": "B2B",
  "tags": ["priority", "pilot"]
}
```

### Get / Update / Delete

- `GET /contacts/{id}`
- `PATCH /contacts/{id}` with partial body
- `DELETE /contacts/{id}`

### Import CSV

`POST /contacts/import`

```json
{
  "csv": "firstName,lastName,email,phone\nJane,Doe,jane@example.com,555-0100"
}
```

Response:

```json
{
  "imported": 1,
  "rows": [
    {
      "id": "65fb00112233445566772001",
      "firstName": "Jane",
      "lastName": "Doe"
    }
  ]
}
```

### Export CSV

`GET /contacts/export?format=csv`

Response: `text/csv`

### Bulk delete

`POST /contacts/bulk-delete`

```json
{
  "ids": ["contact_1", "contact_2"]
}
```

Response:

```json
{
  "deleted": 2
}
```

## 5.7 Companies

### Create

`POST /companies`

```json
{
  "name": "Acme Health",
  "domain": "acmehealth.example",
  "industry": "Healthcare",
  "size": "51-200"
}
```

### List/Get/Update/Delete

- `GET /companies`
- `GET /companies/{id}`
- `PATCH /companies/{id}`
- `DELETE /companies/{id}`

## 5.8 Deals

### Create

`POST /deals`

```json
{
  "title": "Acme Annual Contract",
  "amount": 125000,
  "currency": "USD",
  "stageId": "65fb00112233445566771001",
  "companyId": "65fb00112233445566773001",
  "primaryContactId": "65fb00112233445566772001",
  "expectedCloseDate": "2026-04-15T00:00:00.000Z",
  "status": "OPEN",
  "description": "Enterprise license + onboarding"
}
```

### List/Get/Update/Delete

- `GET /deals?q=contract&stageId=...&status=OPEN&ownerId=...&limit=20`
- `GET /deals/{id}`
- `PATCH /deals/{id}`
- `DELETE /deals/{id}`

## 5.9 Tasks

### Create

`POST /tasks`

```json
{
  "title": "Schedule discovery call",
  "dueAt": "2026-03-05T09:00:00.000Z",
  "status": "OPEN",
  "assigneeId": "65fb00112233445566778898",
  "relatedType": "deal",
  "relatedId": "65fb00112233445566774001"
}
```

### List/Get/Update/Delete

- `GET /tasks?status=OPEN&assigneeId=...&relatedType=deal&relatedId=...&limit=20`
- `GET /tasks/{id}`
- `PATCH /tasks/{id}` (e.g. `{ "status": "DONE" }`)
- `DELETE /tasks/{id}`

## 5.10 Notes and Activities

### Create note

`POST /notes`

```json
{
  "body": "Customer requested revised pricing.",
  "relatedType": "deal",
  "relatedId": "65fb00112233445566774001"
}
```

### Notes API

- `GET /notes?relatedType=deal&relatedId=...&limit=20`
- `DELETE /notes/{id}`

### Activities API

- `GET /activities?entityType=deal&entityId=...&dateFrom=...&dateTo=...`

## 5.11 Invoices

### Create

`POST /invoices`

```json
{
  "invoiceNumber": "INV-1001",
  "title": "Implementation phase 1",
  "amount": 5000,
  "currency": "USD",
  "status": "SENT",
  "notes": "Net 14",
  "relatedType": "company",
  "relatedId": "65fb00112233445566773001",
  "issuedAt": "2026-03-01T00:00:00.000Z",
  "dueAt": "2026-03-15T00:00:00.000Z"
}
```

### List/Get/Update/Delete

- `GET /invoices`
- `GET /invoices/{id}`
- `PATCH /invoices/{id}`
- `DELETE /invoices/{id}`

Important implementation note:

- Web supports invoice line items by encoding them inside `notes` with marker block `[[QUE_INVOICE_ITEMS_V1]]...` and also reads `invoice.items` if backend returns it.
- Mobile should support both:
  - `items` in response if available
  - marker-encoded items in `notes` as fallback

## 5.12 Visits

### Create

`POST /visits`

```json
{
  "contactId": "65fb00112233445566772001",
  "contactName": "Jane Doe",
  "date": "2026-03-05",
  "time": "10:00",
  "durationMinutes": 60,
  "reason": "Product walkthrough",
  "status": "SCHEDULED",
  "notes": "Bring pricing options"
}
```

### List/Get/Update/Delete

- `GET /visits?status=SCHEDULED&contactId=...&limit=20`
- `GET /visits/{id}`
- `PATCH /visits/{id}`
- `DELETE /visits/{id}`

## 5.13 Reminders

### Create

`POST /reminders`

```json
{
  "title": "Follow up with Acme",
  "message": "Call before EOD",
  "remindAt": "2026-03-06T15:00:00.000Z",
  "priority": "HIGH",
  "channel": "IN_APP",
  "assigneeId": "65fb00112233445566778898",
  "relatedType": "deal",
  "relatedId": "65fb00112233445566774001",
  "metadata": {
    "source": "manual"
  }
}
```

### List/Get/Update/Delete

- `GET /reminders?status=PENDING&priority=HIGH&mine=true&remindAtFrom=...`
- `GET /reminders/{id}`
- `PATCH /reminders/{id}`
- `DELETE /reminders/{id}`

## 5.14 Notifications

### List

`GET /notifications?status=UNREAD&channel=IN_APP&limit=30`

Response example row:

```json
{
  "id": "65fb00112233445566779001",
  "workspaceId": "65fb00112233445566770011",
  "userId": "65fb00112233445566778898",
  "reminderId": "65fb00112233445566778001",
  "type": "reminder.triggered",
  "title": "Follow up with Acme",
  "message": "Call before EOD",
  "status": "UNREAD",
  "priority": "HIGH",
  "channel": "IN_APP",
  "relatedType": "deal",
  "relatedId": "65fb00112233445566774001",
  "deliveredAt": "2026-03-06T15:00:00.000Z",
  "readAt": null,
  "metadata": { "sourceType": "MANUAL" },
  "createdAt": "2026-03-06T15:00:01.000Z",
  "updatedAt": "2026-03-06T15:00:01.000Z"
}
```

### Update single notification

`PATCH /notifications/{id}`

```json
{
  "status": "READ"
}
```

### Delete single notification

`DELETE /notifications/{id}`

### Mark all read

`POST /notifications/mark-all-read`

```json
{
  "userId": "65fb00112233445566778898"
}
```

Response:

```json
{
  "success": true
}
```

## 5.15 AI Relationship Intelligence

Web endpoint:

- `POST /api/ai/relationship-intelligence`

Important:

- This endpoint is implemented inside Next.js and checks session cookie auth.
- Mobile apps cannot reliably use it via bearer token alone.
- For Flutter production use, expose an equivalent backend endpoint or move this logic to backend service.

Request:

```json
{
  "entityType": "contact",
  "entityId": "65fb00112233445566772001",
  "entityName": "Jane Doe",
  "notes": [
    { "body": "Customer asked for revised pricing", "createdAt": "2026-03-01T11:00:00.000Z" }
  ],
  "activities": [
    { "type": "deal.updated", "createdAt": "2026-03-01T11:30:00.000Z", "metadata": { "status": "OPEN" } }
  ],
  "tasks": [
    { "title": "Follow up", "status": "OPEN", "dueAt": "2026-03-05T09:00:00.000Z" }
  ],
  "deals": [
    { "title": "Acme Annual Contract", "status": "OPEN", "amount": 125000, "currency": "USD" }
  ],
  "invoices": [
    { "status": "SENT", "amount": 5000, "currency": "USD", "dueAt": "2026-03-15T00:00:00.000Z", "paidAt": null }
  ]
}
```

Response:

```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "generatedAt": "2026-03-04T09:30:00.000Z",
  "insights": {
    "summary": "Relationship is active with commercial momentum.",
    "healthScore": 78,
    "healthLabel": "strong",
    "priority": "medium",
    "signals": ["Recent engagement", "Open opportunity"],
    "risks": ["Pricing sensitivity"],
    "recommendedActions": [
      { "title": "Send revised quote", "reason": "Customer requested pricing update", "priority": "high" },
      { "title": "Book follow-up call", "reason": "Keep momentum", "priority": "medium" },
      { "title": "Confirm decision timeline", "reason": "Improve forecast confidence", "priority": "medium" }
    ],
    "outreachDraft": "Hi Jane, sharing the revised proposal...",
    "nextBestChannel": "email"
  }
}
```

Possible errors:

- `401` unauthorized (no session token in web)
- `400` invalid request body
- `503` missing AI key
- `500` generation failure

## 6) Flutter + Riverpod Implementation Blueprint

Recommended packages:

- `flutter_riverpod`
- `dio`
- `freezed` + `json_serializable`
- `go_router`
- `flutter_secure_storage`

Suggested layers:

- `core/network`: Dio client, interceptors, error mapper
- `features/<domain>/data`: DTOs, remote data source, repository impl
- `features/<domain>/domain`: entities + repository contract
- `features/<domain>/presentation`: Riverpod providers + UI

Recommended provider strategy:

- `AuthController` (`AsyncNotifier<AuthState>`)
- `WorkspaceController` (`Notifier<WorkspaceState>`)
- Per-entity paged controllers:
  - `contactsListProvider`
  - `companiesListProvider`
  - `dealsListProvider`
  - `tasksListProvider`
  - `invoicesListProvider`
  - `visitsListProvider`

Cross-cutting providers:

- `dioProvider`
- `tokenStorageProvider`
- `apiHeadersProvider` (adds bearer + workspace header)
- `authInterceptorProvider` (refresh and retry)

## 7) Feature Parity Checklist

Phase 1 (must-have parity):

- Auth + workspace switching
- Contacts/companies/deals/tasks/invoices/visits CRUD
- Notes + activities timeline
- Pipeline stage management
- Onboarding flow

Phase 2 (high-value parity):

- Calendar aggregation (tasks + visits)
- AI relationship intelligence panel actions
- Import/export contacts

Phase 3 (extended parity):

- Reminders + notifications
- Reports/search endpoints when backend/UI is finalized

## 8) Known Notes / Gaps

- OpenAPI file is useful but not fully up to date with current app behavior (e.g. reminders/notifications and invoice status variations).
- Reports and CallOps pages in web are currently placeholders.
- `onboarding/*` endpoints are used opportunistically in web; fallback uses standard workspace/stage/invite APIs.

## 9) Source Files Used For This Handoff

- `src/lib/api-base.ts`
- `src/lib/api-proxy.ts`
- `src/lib/crm-types.ts`
- `src/app/api/**/route.ts`
- `src/app/(app)/**/page.tsx`
- `src/components/RelationshipIntelligencePanel.tsx`
- `src/lib/journal.ts`
- `openapi/crm.openapi.yaml`
- `docs/backend-handoff.md`
