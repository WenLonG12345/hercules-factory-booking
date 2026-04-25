# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Hercules Factory Context

Hercules Factory manages Muay Thai classes, members, attendance, invoices,
payments, WhatsApp reminders, reports, and landing page CMS content. Favor a
working MVP and keep implementation choices aligned with the existing Next.js
App Router, tRPC, Drizzle, PostgreSQL, and Tailwind structure.

## Commands

```bash
bun dev              # start dev server
bun build            # production build
bun lint             # Biome linter
bun format           # Biome formatter
bun db:generate      # generate Drizzle migrations after schema changes
bun db:migrate       # apply pending migrations
bun db:studio        # open Drizzle Studio UI
bun db:seed          # seed demo data
```

There are no unit tests. Verify features by running the dev server.

## Architecture

### Stack
- **Next.js 16 App Router** with React 19 and React Compiler (`reactCompiler: true` in next.config.ts)
- **tRPC 11** for type-safe API — all mutations and queries go through tRPC procedures defined in `src/server/routers/`
- **Drizzle ORM** with `postgres-js` driver — schema in `src/db/schema.ts`, instance in `src/db/index.ts`
- **Zod 4** validators in `src/server/validators/` — used for tRPC input schemas
- **Tailwind CSS v4** (`@tailwindcss/postcss`) — no `tailwind.config.js`; config lives in CSS via `@theme`
- **Biome** (not ESLint/Prettier) for linting and formatting

### Request Flow

Public pages → React Server Components fetch via `src/server/services/queries.ts` (direct DB reads).

Admin pages → client components call tRPC hooks (`api.router.procedure.useQuery/useMutation`) → `src/server/routers/` → `src/server/services/` for business logic.

tRPC handler is at `src/app/api/trpc/[trpc]/route.ts`. All routers are combined in `src/server/routers/_app.ts`.

### Auth

Admin-only procedures use `adminProcedure` (defined in `src/server/trpc.ts`), which checks a session cookie set by the server action in `src/app/admin/login/`. The entire admin portal is under `src/app/admin/(portal)/` — this route group wraps every page with `AdminShell`.

### Demo Mode

When `DATABASE_URL` is not set, pages fall back to static demo data from `src/lib/demo-data.ts`. This lets the landing page and public routes render without a database.

### Business Rules (preserve these)
- Class capacity is enforced before booking (`assertClassHasCapacity` in `src/server/services/business.ts`)
- 10-class membership credits are deducted **only on `attended` check-in**, not on booking
- Membership expiry is checked before allowing bookings
- WhatsApp links are generated via `whatsappLink` in `src/lib/utils.ts` (Malaysian format)

### Database
Uses Docker Compose for local Postgres (`docker compose up -d`). Default connection: `postgres://postgres:postgres@localhost:5432/hercules_factory`. Set `DATABASE_URL` in `.env.local` to override.

### Path Alias
`@/*` maps to `./src/*`.
