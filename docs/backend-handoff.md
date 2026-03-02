# CRM Frontend API Reference (With Request/Response Examples)

Date: 2026-03-01
Owner: Backend Team
Audience: Frontend Team

## 1) Base URL and Headers

Base URL example:

`https://<api-id>.execute-api.<region>.amazonaws.com/dev`

Required header for authenticated endpoints:

`Authorization: Bearer <access_token>`

Optional workspace override:

`X-Workspace-Id: <workspaceId>`

## 2) Global Response Contracts

List envelope:

```json
{
  "rows": [],
  "total": 0,
  "nextCursor": null
}
```

Error envelope:

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "issues": [
    { "path": "email", "message": "Invalid email" }
  ]
}
```

No-content responses:

- HTTP `204`
- Empty body

## 3) Enums

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
- `ReminderRelatedType`: `contact | company | deal | task | invoice | visit`

## 4) Auth Endpoints

### 4.1 POST /auth/register

Request:

```json
{
  "name": "Jane Owner",
  "email": "jane.owner@crm.local",
  "password": "OwnerPass123!",
  "workspaceName": "Jane Workspace"
}
```

Response `201`:

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

### 4.2 POST /auth/login

Request:

```json
{
  "email": "jane.owner@crm.local",
  "password": "OwnerPass123!"
}
```

Response `200`: same shape as register.

### 4.3 GET /auth/me

Response `200`:

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

### 4.4 POST /auth/refresh

Request:

```json
{
  "refreshToken": "<refresh>"
}
```

Response `200`: same shape as register.

### 4.5 POST /auth/logout

Request:

```json
{
  "refreshToken": "<refresh>"
}
```

Response `200`:

```json
{
  "success": true
}
```

## 5) Workspace and Access Endpoints

### 5.1 GET /workspaces

Response `200`:

```json
{
  "rows": [
    {
      "id": "65fb00112233445566770011",
      "name": "Jane Workspace",
      "slug": "jane-workspace",
      "createdAt": "2026-03-01T08:00:00.000Z",
      "updatedAt": "2026-03-01T08:00:00.000Z",
      "role": "OWNER"
    }
  ],
  "total": 1,
  "nextCursor": null
}
```

### 5.2 POST /workspaces

Request:

```json
{
  "name": "Medical Sales",
  "slug": "medical-sales"
}
```

Response `201`:

```json
{
  "id": "65fb00112233445566770012",
  "name": "Medical Sales",
  "slug": "medical-sales",
  "createdAt": "2026-03-01T08:10:00.000Z",
  "updatedAt": "2026-03-01T08:10:00.000Z"
}
```

### 5.3 POST /workspaces/switch

Request:

```json
{
  "workspaceId": "65fb00112233445566770012"
}
```

Response `200`:

```json
{
  "token": "<jwt>",
  "refreshToken": "<refresh>",
  "user": {
    "id": "65fb00112233445566778899",
    "name": "Jane Owner",
    "email": "jane.owner@crm.local"
  },
  "workspaceId": "65fb00112233445566770012"
}
```

### 5.4 GET /memberships

Response `200`:

```json
{
  "rows": [
    {
      "id": "65fb00112233445566770101",
      "workspaceId": "65fb00112233445566770011",
      "userId": "65fb00112233445566778899",
      "role": "OWNER",
      "createdAt": "2026-03-01T08:00:00.000Z",
      "updatedAt": "2026-03-01T08:00:00.000Z",
      "user": {
        "id": "65fb00112233445566778899",
        "name": "Jane Owner",
        "email": "jane.owner@crm.local",
        "createdAt": "2026-03-01T08:00:00.000Z",
        "updatedAt": "2026-03-01T08:00:00.000Z"
      }
    }
  ],
  "total": 1,
  "nextCursor": null
}
```

### 5.5 PATCH /memberships/{id}

Request:

```json
{
  "role": "ADMIN"
}
```

Response `200`:

```json
{
  "id": "65fb00112233445566770101",
  "workspaceId": "65fb00112233445566770011",
  "userId": "65fb00112233445566778899",
  "role": "ADMIN",
  "createdAt": "2026-03-01T08:00:00.000Z",
  "updatedAt": "2026-03-01T08:20:00.000Z"
}
```

### 5.6 DELETE /memberships/{id}

Response `204` (empty body).

### 5.7 GET /users

Response `200`:

```json
{
  "rows": [
    {
      "id": "65fb00112233445566778899",
      "name": "Jane Owner",
      "email": "jane.owner@crm.local",
      "createdAt": "2026-03-01T08:00:00.000Z",
      "updatedAt": "2026-03-01T08:00:00.000Z"
    }
  ],
  "total": 1,
  "nextCursor": null
}
```

### 5.8 GET /invites

Response `200`:

```json
{
  "rows": [
    {
      "id": "65fb00112233445566770201",
      "workspaceId": "65fb00112233445566770011",
      "email": "new.user@crm.local",
      "role": "MEMBER",
      "token": "<invite-token>",
      "expiresAt": "2026-03-08T10:00:00.000Z",
      "acceptedAt": null,
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-01T10:00:00.000Z"
    }
  ],
  "total": 1,
  "nextCursor": null
}
```

### 5.9 POST /invites

Request:

```json
{
  "email": "new.user@crm.local",
  "role": "MEMBER"
}
```

Response `201`: same object shape as invite in list.

### 5.10 POST /invites/accept

Request (logged-in user):

```json
{
  "token": "<invite-token>"
}
```

Request (new user signup through invite):

```json
{
  "token": "<invite-token>",
  "name": "New User",
  "email": "new.user@crm.local",
  "password": "UserPass123!"
}
```

Response `200`: same shape as auth session.

### 5.11 DELETE /invites/{id}

Response `204`.

## 6) Stage Endpoints

### 6.1 GET /stages

Response `200`:

```json
{
  "rows": [
    {
      "id": "65fb00112233445566771001",
      "workspaceId": "65fb00112233445566770011",
      "name": "Lead",
      "order": 0,
      "createdAt": "2026-03-01T08:00:00.000Z",
      "updatedAt": "2026-03-01T08:00:00.000Z"
    }
  ],
  "total": 1,
  "nextCursor": null
}
```

### 6.2 POST /stages

Request:

```json
{
  "name": "Qualified",
  "order": 1
}
```

Response `201`: stage object.

### 6.3 PATCH /stages/{id}

Request:

```json
{
  "name": "Proposal",
  "order": 2
}
```

Response `200`: stage object.

### 6.4 PUT /stages/reorder

Request:

```json
{
  "stages": [
    { "id": "65fb00112233445566771001", "order": 0 },
    { "id": "65fb00112233445566771002", "order": 1 }
  ]
}
```

Response `200`:

```json
{
  "rows": [
    {
      "id": "65fb00112233445566771001",
      "workspaceId": "65fb00112233445566770011",
      "name": "Lead",
      "order": 0,
      "createdAt": "2026-03-01T08:00:00.000Z",
      "updatedAt": "2026-03-01T09:30:00.000Z"
    }
  ]
}
```

### 6.5 DELETE /stages/{id}?targetStageId=<id>

Response `204`.

## 7) Contacts

### 7.1 GET /contacts

Example query:

`/contacts?q=jane&companyId=65fb...&customerType=B2B&tag=priority&limit=20`

Response `200`:

```json
{
  "rows": [
    {
      "id": "65fb00112233445566772001",
      "workspaceId": "65fb00112233445566770011",
      "ownerId": "65fb00112233445566778899",
      "firstName": "Jane",
      "lastName": "Doe",
      "jobTitle": "Procurement Manager",
      "email": "jane.doe@acme.com",
      "phone": "+1-555-1000",
      "companyId": "65fb00112233445566773001",
      "customerType": "B2B",
      "tags": ["priority", "pilot"],
      "createdAt": "2026-03-01T09:00:00.000Z",
      "updatedAt": "2026-03-01T09:00:00.000Z"
    }
  ],
  "total": 1,
  "nextCursor": null
}
```

### 7.2 POST /contacts

Request:

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

Response `201`: contact object.

### 7.3 GET /contacts/{id}

Response `200`: contact object.

### 7.4 PATCH /contacts/{id}

Request:

```json
{
  "jobTitle": "Head of Procurement",
  "tags": ["priority", "vip"]
}
```

Response `200`: updated contact object.

### 7.5 DELETE /contacts/{id}

Response `204`.

## 8) Companies

### 8.1 GET /companies

Example query:

`/companies?q=acme&limit=20`

Response `200`: list envelope with company rows.

### 8.2 POST /companies

Request:

```json
{
  "name": "Acme Health",
  "domain": "acmehealth.example",
  "industry": "Healthcare",
  "size": "51-200"
}
```

Response `201`: company object.

### 8.3 GET /companies/{id}

Response `200`: company object.

### 8.4 PATCH /companies/{id}

Request:

```json
{
  "industry": "Medical Devices",
  "size": "201-500"
}
```

Response `200`: updated company object.

### 8.5 DELETE /companies/{id}

Response `204`.

## 9) Deals

### 9.1 GET /deals

Example query:

`/deals?q=contract&stageId=65fb...&status=OPEN&ownerId=65fb...&limit=20`

Response `200`: list envelope with deal rows.

### 9.2 POST /deals

Request:

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

Response `201`: deal object.

### 9.3 GET /deals/{id}

Response `200`: deal object.

### 9.4 PATCH /deals/{id}

Request:

```json
{
  "status": "WON",
  "amount": 130000
}
```

Response `200`: updated deal object.

### 9.5 DELETE /deals/{id}

Response `204`.

## 10) Tasks

### 10.1 GET /tasks

Example query:

`/tasks?status=OPEN&assigneeId=65fb...&relatedType=deal&relatedId=65fb...&limit=20`

Response `200`: list envelope with task rows.

### 10.2 POST /tasks

Request:

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

Response `201`: task object.

### 10.3 GET /tasks/{id}

Response `200`: task object.

### 10.4 PATCH /tasks/{id}

Request:

```json
{
  "status": "DONE"
}
```

Response `200`: updated task object.

### 10.5 DELETE /tasks/{id}

Response `204`.

## 11) Notes

### 11.1 GET /notes

Example query:

`/notes?relatedType=deal&relatedId=65fb...&limit=20`

Response `200`: list envelope with note rows.

### 11.2 POST /notes

Request:

```json
{
  "body": "Customer requested revised pricing.",
  "relatedType": "deal",
  "relatedId": "65fb00112233445566774001"
}
```

Response `201`:

```json
{
  "id": "65fb00112233445566775001",
  "workspaceId": "65fb00112233445566770011",
  "authorId": "65fb00112233445566778899",
  "body": "Customer requested revised pricing.",
  "relatedType": "deal",
  "relatedId": "65fb00112233445566774001",
  "createdAt": "2026-03-01T11:00:00.000Z",
  "updatedAt": "2026-03-01T11:00:00.000Z"
}
```

### 11.3 DELETE /notes/{id}

Response `204`.

## 12) Activities

### 12.1 GET /activities

Example query:

`/activities?entityType=deal&entityId=65fb...&dateFrom=2026-03-01T00:00:00.000Z&dateTo=2026-03-31T23:59:59.999Z`

Response `200`:

```json
{
  "rows": [
    {
      "id": "65fb00112233445566776001",
      "workspaceId": "65fb00112233445566770011",
      "actorId": "65fb00112233445566778899",
      "type": "deal.updated",
      "entityType": "deal",
      "entityId": "65fb00112233445566774001",
      "metadata": {
        "fields": ["status"],
        "statusChanged": true
      },
      "createdAt": "2026-03-01T11:30:00.000Z"
    }
  ],
  "total": 1,
  "nextCursor": null
}
```

## 13) Invoices (Expanded)

### 13.1 GET /invoices

Example query:

`/invoices?status=SENT&relatedType=company&relatedId=65fb...&dueAtFrom=2026-03-01T00:00:00.000Z&dueAtTo=2026-03-31T23:59:59.999Z`

Response `200`: list envelope with invoice rows.

### 13.2 POST /invoices

Request:

```json
{
  "title": "Acme Setup + Subscription",
  "notes": "Net 14",
  "currency": "USD",
  "status": "SENT",
  "relatedType": "company",
  "relatedId": "65fb00112233445566773001",
  "issuedAt": "2026-03-01T00:00:00.000Z",
  "dueAt": "2026-03-15T00:00:00.000Z",
  "items": [
    {
      "description": "Setup Fee",
      "quantity": 1,
      "unitPrice": 5000,
      "taxRate": 0
    },
    {
      "description": "Subscription",
      "quantity": 12,
      "unitPrice": 1000,
      "taxRate": 5
    }
  ],
  "discountType": "PERCENT",
  "discountValue": 10,
  "payments": [
    {
      "amount": 2000,
      "paidAt": "2026-03-02T10:00:00.000Z",
      "method": "BANK_TRANSFER",
      "reference": "TRX-1001"
    }
  ],
  "customerName": "Acme Health",
  "customerEmail": "finance@acmehealth.example",
  "billingAddress": {
    "line1": "10 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US"
  },
  "terms": "Net 14",
  "poNumber": "PO-2026-0005"
}
```

Response `201`:

```json
{
  "id": "65fb00112233445566777001",
  "workspaceId": "65fb00112233445566770011",
  "createdById": "65fb00112233445566778899",
  "invoiceNumber": "INV-000123",
  "title": "Acme Setup + Subscription",
  "notes": "Net 14",
  "amount": 15300,
  "items": [
    {
      "description": "Setup Fee",
      "quantity": 1,
      "unitPrice": 5000,
      "taxRate": 0,
      "lineSubtotal": 5000,
      "lineTax": 0,
      "lineTotal": 5000
    },
    {
      "description": "Subscription",
      "quantity": 12,
      "unitPrice": 1000,
      "taxRate": 5,
      "lineSubtotal": 12000,
      "lineTax": 600,
      "lineTotal": 12600
    }
  ],
  "subtotal": 17000,
  "discountType": "PERCENT",
  "discountValue": 10,
  "discountAmount": 1700,
  "taxAmount": 600,
  "totalAmount": 15900,
  "amountPaid": 2000,
  "balanceDue": 13900,
  "payments": [
    {
      "amount": 2000,
      "paidAt": "2026-03-02T10:00:00.000Z",
      "method": "BANK_TRANSFER",
      "reference": "TRX-1001",
      "note": null,
      "recordedById": "65fb00112233445566778899"
    }
  ],
  "customerName": "Acme Health",
  "customerEmail": "finance@acmehealth.example",
  "billingAddress": {
    "line1": "10 Main St",
    "line2": null,
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US"
  },
  "terms": "Net 14",
  "poNumber": "PO-2026-0005",
  "currency": "USD",
  "status": "PARTIALLY_PAID",
  "relatedType": "company",
  "relatedId": "65fb00112233445566773001",
  "issuedAt": "2026-03-01T00:00:00.000Z",
  "dueAt": "2026-03-15T00:00:00.000Z",
  "paidAt": null,
  "createdAt": "2026-03-01T12:00:00.000Z",
  "updatedAt": "2026-03-01T12:00:00.000Z"
}
```

### 13.3 GET /invoices/{id}

Response `200`: invoice object (same shape as create response).

### 13.4 PATCH /invoices/{id}

Request:

```json
{
  "status": "PAID",
  "payments": [
    {
      "amount": 15900,
      "paidAt": "2026-03-10T10:00:00.000Z",
      "method": "WIRE"
    }
  ]
}
```

Response `200`: updated invoice object.

### 13.5 DELETE /invoices/{id}

Response `204`.

## 14) Visits

### 14.1 GET /visits

Example query:

`/visits?status=SCHEDULED&contactId=65fb...&limit=20`

Response `200`: list envelope with visit rows.

### 14.2 POST /visits

Request:

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

Response `201`: visit object.

### 14.3 PATCH /visits/{id}

Request:

```json
{
  "status": "COMPLETED",
  "notes": "Great meeting"
}
```

Response `200`: updated visit object.

### 14.4 DELETE /visits/{id}

Response `204`.

## 15) Reminders (New)

### 15.1 GET /reminders

Example query:

`/reminders?status=PENDING&priority=HIGH&mine=true&remindAtFrom=2026-03-01T00:00:00.000Z`

Response `200`: list envelope with reminder rows.

### 15.2 POST /reminders

Request:

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

Response `201`:

```json
{
  "id": "65fb00112233445566778001",
  "workspaceId": "65fb00112233445566770011",
  "createdById": "65fb00112233445566778899",
  "assigneeId": "65fb00112233445566778898",
  "title": "Follow up with Acme",
  "message": "Call before EOD",
  "remindAt": "2026-03-06T15:00:00.000Z",
  "status": "PENDING",
  "priority": "HIGH",
  "channel": "IN_APP",
  "relatedType": "deal",
  "relatedId": "65fb00112233445566774001",
  "sourceType": "MANUAL",
  "dedupeKey": null,
  "sentAt": null,
  "cancelledAt": null,
  "metadata": {
    "source": "manual"
  },
  "createdAt": "2026-03-01T13:00:00.000Z",
  "updatedAt": "2026-03-01T13:00:00.000Z"
}
```

### 15.3 GET /reminders/{id}

Response `200`: reminder object.

### 15.4 PATCH /reminders/{id}

Request:

```json
{
  "status": "CANCELLED"
}
```

Response `200`: updated reminder object.

### 15.5 DELETE /reminders/{id}

Response `204`.

## 16) Notifications (New)

### 16.1 GET /notifications

Example query:

`/notifications?status=UNREAD&channel=IN_APP&limit=30`

Response `200`:

```json
{
  "rows": [
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
      "metadata": {
        "sourceType": "MANUAL"
      },
      "createdAt": "2026-03-06T15:00:01.000Z",
      "updatedAt": "2026-03-06T15:00:01.000Z"
    }
  ],
  "total": 1,
  "nextCursor": null
}
```

### 16.2 POST /notifications/mark-all-read

Request:

```json
{
  "userId": "65fb00112233445566778898"
}
```

Response `200`:

```json
{
  "success": true
}
```

### 16.3 PATCH /notifications/{id}

Request:

```json
{
  "status": "READ"
}
```

Response `200`: notification object with `readAt` set.

### 16.4 DELETE /notifications/{id}

Response `204`.

## 17) Common Error Examples

Validation error `400`:

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "issues": [
    {
      "path": "dueAt",
      "message": "dueAt must be a valid date"
    }
  ]
}
```

Forbidden `403`:

```json
{
  "error": "Admin role required",
  "code": "FORBIDDEN",
  "issues": []
}
```

Business rule `422`:

```json
{
  "error": "Cannot delete company with active references",
  "code": "BUSINESS_RULE_VIOLATION",
  "issues": []
}
```

## 18) Frontend Notes

- Use `PATCH` for partial updates.
- Parse list data from `rows`.
- For finance UI, use `Invoice.totalAmount`, `Invoice.amountPaid`, and `Invoice.balanceDue`.
- Invoices can become `PARTIALLY_PAID` automatically when payments exist but balance is non-zero.
- Reminders and notifications are workspace-scoped and role-filtered.
- `activities` is the user-facing activity feed, while request-level auditing is backend-internal.
