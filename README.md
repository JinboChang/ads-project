# SuperNext

An advertiser and influencer matching platform built on Next.js 15 with a Hono API and Supabase.

## What This Is
- A platform that connects advertisers with influencers and manages campaign discovery, matching, and collaboration.
- A client-first UI stack with React 19, shadcn/ui, and Tailwind CSS.
- A backend layer powered by Hono that lives inside the Next.js App Router.
- A Supabase-backed data layer with migrations stored in this repo.

## Who This Is For
- Advertisers looking to discover creators and manage partnership workflows.
- Influencers seeking brand partnerships and campaign opportunities.
- Teams maintaining or extending the matching platform with a strict, documented architecture.

## Overview
- App Router architecture with a Hono backend mounted under `app/api/[[...hono]]`.
- Supabase integration (service-role on server, anon on client) validated by Zod.
- Client-only UI built with React 19, shadcn/ui, Tailwind CSS 4, and @tanstack/react-query.
- Opinionated tooling: ESLint, TypeScript, Playwright, Turbopack-friendly dev workflow.

## Architecture At A Glance
```
Client component
  -> React Query hook
  -> @/lib/remote/api-client
  -> /api/[[...hono]] (Hono app)
  -> Supabase
```

## Tech Stack
- Frameworks: Next.js 15, React 19, Hono
- UI & Styling: Tailwind CSS 4, shadcn/ui, lucide-react, framer-motion
- State & Data: @tanstack/react-query, Zustand, React Hook Form
- Validation & Utilities: Zod, ts-pattern, date-fns, es-toolkit, react-use
- Backend & Infra: Supabase (SQL migrations in `supabase/migrations`)

## Directory Layout
```
src/
  app/                Next.js App Router entrypoints (all client components)
    api/[[...hono]]/  Route handler delegating to the Hono app
  backend/            Hono app, middleware, Supabase wrappers, config
  components/         shadcn/ui primitives and shared UI
  features/           Feature modules (components, hooks, backend, lib)
  hooks/              Reusable React hooks
  lib/                Utilities, remote API client, Supabase clients
  remote/             HTTP client wrappers (feature hooks depend on this)
```
Refer to `AGENTS.md` for the complete directory contract and coding standards.

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Duplicate the environment template and supply real credentials:
   ```bash
   cp .env.local.example .env.local
   ```
3. Provide the following keys (sync Preview and Production on Vercel):
   - `NEXT_PUBLIC_SUPABASE_URL`  Supabase project URL (public)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`  Supabase anon key for browser clients
   - `SUPABASE_URL`  Supabase project URL (identical to public URL)
   - `SUPABASE_SERVICE_ROLE_KEY`  Service-role key for backend usage (keep secret)
4. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts
| Command            | Description                                    |
| ------------------ | ---------------------------------------------- |
| `npm run dev`      | Start Next.js dev server with Turbopack         |
| `npm run build`    | Production build (used by Vercel)               |
| `npm run start`    | Launch the production server                    |
| `npm run lint`     | Run ESLint with project rules                   |
| `npm run test:e2e` | Execute Playwright end-to-end suite             |

## Supabase Migrations
- Place SQL files in `supabase/migrations` using `0001_description.sql` naming.
- Keep migrations idempotent (`CREATE TABLE IF NOT EXISTS`, `BEGIN ... EXCEPTION`).
- Include an `updated_at` column with a trigger and disable RLS.
- Apply migrations via the Supabase CLI or dashboard; this repository only stores SQL.

## Deployment (Vercel)
1. Log in and link the project:
   ```bash
   vercel login
   vercel link
   ```
2. Upload environment variables for each target:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
   vercel env add SUPABASE_URL production
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   # repeat for preview (and development if needed)
   ```
3. Trigger a preview build:
   ```bash
   vercel
   ```
4. Promote to production:
   ```bash
   vercel --prod
   ```
5. Subsequent git pushes create new previews; merges into the production branch update the live site.

## Coding Guidelines
- Every React component must declare `"use client"`.
- Page components should receive route params via async functions that resolve the params promise.
- Feature hooks must perform network calls through `@/lib/remote/api-client`.
- Prefer functional, immutable patterns and early returns.
- Validate external data with Zod before consumption.

## Contributing
1. Fork the repository and create a feature branch.
2. Adhere to linting and formatting (`npm run lint`).
3. Update or add tests when introducing behavior changes.
4. Open a pull request describing the change set and verification.

---
This template is actively evolving; track updates or open issues in the project board.
