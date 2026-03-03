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
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
```

API base URL is hardcoded in [`src/lib/api-base.ts`](src/lib/api-base.ts).
Set `AI_PROVIDER=gemini` to switch to Gemini instead of GPT.

## Key Source Files

- `src/lib/crm-api.ts`: external CRM API client (`apiRequest`, `listAll`)
- `src/lib/auth.ts`, `src/lib/auth-client.ts`: session helpers
- `src/lib/crm-types.ts`: core domain models
- `src/lib/ai-client.ts`, `src/app/api/ai/relationship-intelligence/route.ts`: AI provider adapter + relationship intelligence API
- `src/lib/validators.ts`: request validation contracts
- `src/app/(auth)/*`, `src/app/onboarding/*`, `src/app/(app)/*`: route groups and pages
- `src/app/api/*`: active and stub internal Next API routes
- `src/lib/visits-client.ts`: localStorage-only visits/calendar utilities

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
