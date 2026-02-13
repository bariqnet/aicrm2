# Lightfield-style Simple CRM

Production-quality Next.js App Router CRM with minimal, modern UI inspired by Lightfield vibes (original implementation).

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Zustand (UI state)
- lucide-react icons
- ESLint + Prettier

## Setup
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

## Environment Variables
Create `.env.local`:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
USE_MOCK_DATA=true
```

## Architecture
- `src/lib/types.ts`: domain types for Person, Company, Deal, Task, Activity.
- `src/lib/api/`:
  - `mock.ts`: in-memory DB and realistic sample records.
  - `client.ts`: fetch wrapper for future external API.
  - `index.ts`: service layer abstraction with mock/default provider and create/list methods.
- `src/components/`: reusable shell and UI primitives (`AppShell`, `SidebarNav`, `Topbar`, `DataTable`, `CommandPalette`, `DetailDrawer`, `Timeline`, `ModalForm`, etc.).
- `src/app/(app)/...`: route pages for dashboard, people, companies, pipeline, tasks, inbox, settings.
- `src/app/api/*`: route handlers showing proxy shape for eventual external integration.

## Scripts
- `npm run dev` – run local dev server
- `npm run build` – production build
- `npm run start` – start production server
- `npm run lint` – lint project
- `npm run typecheck` – TypeScript check
- `npm run format` – prettier format
