# Que (AI-driven CRM)

Next.js App Router CRM application for Que, an AI-driven CRM platform.

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Create `.env.local` using:

```env
SESSION_PASSWORD=replace-with-long-random-string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

API base URL is hardcoded in [`src/lib/api-base.ts`](src/lib/api-base.ts).

## Key Source Files

- `src/lib/crm-api.ts`: external CRM API client (`apiRequest`, `listAll`)
- `src/lib/auth.ts`, `src/lib/auth-client.ts`: session helpers
- `src/lib/crm-types.ts`: core domain models
- `src/lib/validators.ts`: request validation contracts
- `src/app/(auth)/*`, `src/app/onboarding/*`, `src/app/(app)/*`: route groups and pages
- `src/app/api/*`: active and stub internal Next API routes
- `src/lib/visits-client.ts`: localStorage-only visits/calendar utilities

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
