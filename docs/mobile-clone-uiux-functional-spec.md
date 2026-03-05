# Mobile Clone Specification (Flutter)

Date: 2026-03-04
Project: `aicrm2` (Que AI CRM)
Objective: deliver a Flutter app that is a functional and visual clone of the current web app.

## 1) Clone Definition (Non-Negotiable)

The Flutter app must match the web app in:

- Information architecture and navigation order
- Feature set and business logic
- API behavior and edge cases
- UI hierarchy and layout rhythm
- Typography, spacing, radii, and color system
- State handling behavior (loading, empty, error, success)
- Interaction patterns (confirmation dialogs, form validation, status changes)
- Language support (English/Arabic) including direction (LTR/RTL)

Allowed adaptation:

- Layout can be responsive for phone/tablet, but visual language and behavior must remain equivalent.
- Desktop-only concepts (sidebar width/collapse, web print) can be translated to native mobile patterns while preserving flow.

## 2) Global Design System (Must Match)

## 2.1 Typography

- Primary font: `IBM Plex Sans` (weights 400, 500, 600, 700)
- Monospace font: `IBM Plex Mono` (weights 400, 500, 600)

## 2.2 Color Tokens (Light)

From `src/app/globals.css`:

- `background`: `hsl(210,20%,98%)` (`#f9fafb`)
- `foreground`: `hsl(222,23%,10%)` (`#14171f`)
- `surface`: `hsl(0,0%,100%)` (`#ffffff`)
- `surface2`: `hsl(210,24%,97%)` (`#f6f7f9`)
- `border`: `hsl(220,16%,88%)` (`#dcdfe5`)
- `muted`: `hsl(220,18%,94%)` (`#edeff2`)
- `mutedForeground`: `hsl(220,10%,40%)` (`#5c6370`)
- `accent`: `hsl(221,83%,53%)` (`#2463eb`)
- `accentForeground`: `hsl(0,0%,100%)` (`#ffffff`)

## 2.3 Color Tokens (Dark)

- `background`: `hsl(222,29%,10%)` (`#121721`)
- `foreground`: `hsl(210,24%,94%)` (`#ecf0f3`)
- `surface`: `hsl(222,24%,12%)` (`#171c26`)
- `surface2`: `hsl(222,20%,15%)` (`#1f232e`)
- `border`: `hsl(222,14%,24%)` (`#353a46`)
- `muted`: `hsl(222,16%,18%)` (`#272b35`)
- `mutedForeground`: `hsl(222,12%,68%)` (`#a4a9b7`)
- `accent`: `hsl(212,92%,62%)` (`#4598f7`)
- `accentForeground`: `hsl(222,29%,10%)` (`#121721`)

## 2.4 Core Shape + Sizing

- `panel`: rounded `12px`, bordered, subtle shadow
- `panel-soft`: rounded `12px`, bordered, softer background
- `input`: height `40px`, radius `6px`, border + focus ring
- `button`: height `36px`, radius `6px`
- `button primary`: solid foreground color with inverted text
- Max app content width: `max-w-6xl` (approx `1152px` desktop reference)

## 2.5 State/Feedback Visuals

- Skeleton shimmer loading blocks (`skeleton-wave`)
- Form input focus ring using accent alpha
- Disabled controls at opacity ~0.6
- Confirmation/error/success dialogs with bordered white surface style

## 3) App Structure To Mirror

## 3.1 Authentication Area

- `/auth/sign-in`
- `/auth/sign-up`
- `/auth/invite/{token}`
- `/onboarding`

Visual pattern:

- Centered auth card layout
- Top-right language toggle
- Footer with brand strip

## 3.2 Main App Shell

- Left navigation sections:
  - Workspace: Dashboard, Contacts, Companies, Pipeline, Tasks
  - Operations: Invoices, CallOps, Visits, Calendar, Reports
  - System: Profile, Settings
- Sticky topbar:
  - Mobile nav toggle
  - Search trigger / command palette
  - Quick actions (`New contact`, `New deal`)
  - Notifications icon
  - Theme toggle
- Persistent language + theme handling

## 3.3 Core Pages

- Dashboard
- Contacts: list, create, import, detail, edit
- Companies: list, create, detail, edit
- Pipeline (Deals): board/list, create, detail, edit
- Tasks: list, create, detail, status toggle
- Invoices: list, create, detail (inline edit), edit page, print view behavior
- Visits: list + create + status updates
- Calendar: combined view (visits + task due dates)
- Profile
- Settings (workspace manager)
- Reports (placeholder UI)
- CallOps (placeholder UI)

## 4) Functional Parity Requirements

All features must call the same backend contracts listed in:

- `docs/mobile-flutter-riverpod-handoff.md`

Mandatory behavior parity by area:

## 4.1 Auth + Session

- Sign-in and sign-up must persist token, refresh token, user, workspace
- Unauthorized flow redirects user to sign-in and preserves intended destination
- Workspace switching updates active workspace context and token/session state

## 4.2 Onboarding (3-Step)

- Step 1: workspace setup (`name`, `slug`, `crmTypeId`)
- Step 2: pipeline stage setup (editable stage list with reorder)
- Step 3: team invites (email + role)
- Use onboarding endpoints first, then fallback to core endpoints exactly as web does

## 4.3 CRM Entities

- Contacts, companies, deals, tasks, invoices, visits support full CRUD parity
- Validation and error handling should mirror web messaging logic
- Relation linking must match web behavior:
  - contact <-> company
  - deal <-> company/contact/stage
  - task <-> relatedType/relatedId
  - invoice <-> contact/company

## 4.4 Pipeline Behavior

- Deal cards grouped by stage
- Drag/drop stage movement equivalent (mobile alternative allowed: long-press + move action sheet)
- Stage changes must call `PATCH /deals/{id}` with full update payload semantics

## 4.5 Relationship Journal + AI

- For contact/company detail screens, include:
  - Relationship journal timeline (notes + activities)
  - Journal entry create flow with optional follow-up task creation
  - AI relationship intelligence panel behavior
- AI endpoint note:
  - Current web endpoint is Next internal (`/api/ai/relationship-intelligence`) with cookie session
  - Mobile production must use a backend-exposed equivalent endpoint

## 4.6 Invoice Line Item Logic

- Support line items from both:
  - direct `invoice.items`
  - encoded block inside `notes` using marker `[[QUE_INVOICE_ITEMS_V1]]`
- Preserve encoding/decoding compatibility with web behavior

## 4.7 Settings Workspace Manager

Must support:

- Stage list CRUD + reordering
- Invite create + revoke
- Membership list display
- Workspace list display

## 4.8 Notifications / Reminders

APIs already exist and must be integrated at data layer for parity roadmap:

- reminders CRUD
- notifications list/update/delete
- mark-all-read

## 5) Interaction & UX Rules To Clone

## 5.1 Dialogs

- Confirmation before destructive actions (delete/revoke/sign-out)
- Success alerts after create/update/status changes
- Error alerts with API message fallback

## 5.2 Loading

- Skeleton states on primary list screens
- Button-level loading states for submits
- Preserve optimistic updates where web uses them (e.g., pipeline move then rollback on failure)

## 5.3 Empty States

- Show explicit empty text on every list/timeline section
- Preserve context-specific wording (e.g., no tasks, no notes, no invoices)

## 5.4 Language + Direction

- Language toggle must switch all visible labels (`en`, `ar`)
- Arabic must use RTL layout direction globally

## 5.5 Theme

- Respect persisted dark/light preference
- Apply tokenized colors consistently to all components

## 6) Mobile Navigation Mapping

Recommended mobile IA mapping from current web shell:

- Bottom tabs (primary): Dashboard, Contacts, Pipeline, Tasks, More
- More stack: Companies, Invoices, Visits, Calendar, Profile, Settings, Reports, CallOps
- Keep deep links equivalent to web paths for internal routing consistency

## 7) Flutter + Riverpod Technical Blueprint

## 7.1 Package Baseline

- `flutter_riverpod`
- `dio`
- `go_router`
- `flutter_secure_storage`
- `freezed` + `json_serializable`

## 7.2 Required Layers

- `core/network`: Dio client + interceptors + error model
- `core/theme`: exact token mapping from web
- `core/i18n`: English/Arabic resources + RTL direction switch
- `features/*/data`: DTO + remote source + repository implementation
- `features/*/presentation`: state providers + UI screens

## 7.3 Providers (Minimum)

- `authControllerProvider`
- `workspaceControllerProvider`
- `themeProvider`
- `languageProvider`
- Entity controllers:
  - contacts, companies, deals, stages, tasks, notes, activities, invoices, visits, invites, memberships, reminders, notifications

## 8) Screen-by-Screen Acceptance Matrix

A screen is considered done only if all are true:

1. Layout hierarchy matches web page intent
2. Color/typography/spacing match design tokens
3. API calls use same endpoint + payload shape
4. Loading/empty/error/success states are implemented
5. CRUD actions mirror web side effects
6. English/Arabic and RTL/LTR are correct
7. Dark/light themes are visually correct

## 9) QA Checklist (Final Sign-Off)

- Auth: sign up, sign in, refresh token, sign out
- Onboarding: complete all 3 steps with and without invites
- Contacts/Companies/Deals/Tasks/Invoices/Visits: full CRUD
- Deal stage movement and stage management
- Notes + activity timelines on detail pages
- AI panel request/response and task creation from recommendations
- Calendar aggregation correctness (visits + tasks)
- Invoice print/share equivalent behavior
- Settings workspace tools complete
- Theme + language persistence across app relaunch

## 10) Source of Truth Files

UI/UX structure and styles extracted from:

- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/AppShell.tsx`
- `src/components/SidebarNav.tsx`
- `src/components/Topbar.tsx`
- `src/components/CommandPalette.tsx`
- `src/components/DetailDrawer.tsx`
- `src/components/SettingsWorkspaceManager.tsx`
- `src/components/RelationshipIntelligencePanel.tsx`
- `src/components/RelationshipJournalSection.tsx`
- `src/app/(app)/**/page.tsx`
- `src/app/(auth)/**/page.tsx`
- `src/app/onboarding/page.tsx`

API behavior extracted from:

- `src/app/api/**/route.ts`
- `src/lib/api-proxy.ts`
- `src/lib/crm-types.ts`
- `openapi/crm.openapi.yaml`
- `docs/backend-handoff.md`
- `docs/mobile-flutter-riverpod-handoff.md`
