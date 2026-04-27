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

Admin & member portal pages → **fully CSR**: layouts are synchronous RSC, pages are `"use client"` components that call tRPC hooks → `src/server/routers/` → `src/server/services/` for business logic. This gives instant shell render (no DB blocking the layout) with client-side skeleton loading states.

tRPC handler is at `src/app/api/trpc/[trpc]/route.ts`. All routers are combined in `src/server/routers/_app.ts`.

tRPC React client is at `src/lib/trpc.ts` (`createTRPCReact<AppRouter>()`). The `<Providers>` component (`src/components/providers.tsx`) wraps layouts with `QueryClientProvider` + `api.Provider`.

### Auth

Admin-only procedures use `adminProcedure` (defined in `src/server/trpc.ts`), which checks a session cookie. Member portal procedures use `customerProcedure` (verifies session + customer record) or `sessionProcedure` (session only).

Layouts are **synchronous** — auth is enforced client-side by guard components, not by SSR awaits:
- `src/components/admin/admin-auth-guard.tsx` — checks `authClient.useSession()`, redirects to `/admin/login` if no session or role ≠ `"admin"`
- `src/components/member/member-auth-guard.tsx` — checks session + `api.portal.profileCheck`, redirects to `/member/login` or `/member/register/complete`

The `authClient` in `src/lib/auth-client.ts` uses `inferAdditionalFields<typeof auth>()` from `better-auth/client/plugins` so that `session.user.role` is typed.

The entire admin portal is under `src/app/admin/(portal)/` — this route group wraps every page with `AdminShell`. Member portal is under `src/app/member/(home)/`.

### Demo Mode

When `DATABASE_URL` is not set, pages fall back to static demo data from `src/lib/demo-data.ts`. This lets the landing page and public routes render without a database.

### Adding New Admin/Member Pages

All new pages in `src/app/admin/(portal)/` and `src/app/member/(home)/` must be client components (`"use client"`). Pattern:

```tsx
"use client";
import { api } from "@/lib/trpc";

export default function MyPage() {
  const { data, isLoading } = api.router.procedure.useQuery();
  const mutation = api.router.action.useMutation({
    onSuccess: () => utils.router.procedure.invalidate(),
  });

  if (isLoading) return <div className="animate-pulse ...">/* skeleton */</div>;
  return /* JSX */;
}
```

- Skeleton keys must be string literals (`["a","b","c"].map(k => <div key={k}.../>)`), never array indices
- Server actions are kept only for file uploads; all other mutations go through tRPC
- For dialogs/child components that trigger mutations: pass an `onSuccess?: () => void` prop so the parent can invalidate the relevant query cache
- Member portal helper formatters are in `src/app/member/(home)/member-format.ts` (pure functions, safe to import in client components). Do NOT import from `member-data.ts` in client components — it has server-only imports

### Business Rules (preserve these)
- Class capacity is enforced before booking (`assertClassHasCapacity` in `src/server/services/business.ts`)
- 10-class membership credits are deducted **only on `attended` check-in**, not on booking
- Membership expiry is checked before allowing bookings
- WhatsApp links are generated via `whatsappLink` in `src/lib/utils.ts` (Malaysian format)

### Database
Uses Docker Compose for local Postgres (`docker compose up -d`). Default connection: `postgres://postgres:postgres@localhost:5432/hercules_factory`. Set `DATABASE_URL` in `.env.local` to override.

### Path Alias
`@/*` maps to `./src/*`.
