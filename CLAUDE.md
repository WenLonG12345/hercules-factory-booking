# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Hercules Factory Context

The **Hercules Factory Management System** is an admin-only tool for a Muay Thai
gym, plus a public landing page driven by a CMS. The admin runs every flow by
hand — there is no member portal and no public booking form. Public enquiries
arrive on WhatsApp.

The flow the whole app is shaped around:

```
Customer → Package → Trial Conversion → Invoice → Daily Income ledger → Reports
              ▲                            ▲
              └── Schedule: sessions + attendance rosters
                  (credits burn here, coach salary lands here)
```

Favor a working MVP and keep implementation choices aligned with the existing
Next.js App Router, tRPC, Drizzle, Turso (SQLite), and Tailwind structure.

## Commands

```bash
bun dev              # start dev server
bun build            # production build
bun lint             # Biome linter
bun format           # Biome formatter
bun db:generate      # generate Drizzle migrations after schema changes
bun db:migrate       # apply pending migrations
bun db:studio        # open Drizzle Studio UI
bun db:seed          # seed CMS content + demo management data
bun db:create-admin  # create the admin login (ADMIN_EMAIL / ADMIN_PASSWORD)
bun db:import        # one-off Excel/CSV import (--dir ./import [--dry-run])
bun test:business    # self-check: credits, capacity, expiry, invoice numbering
bun test:import      # self-check: CSV/date/money parsers
```

No test framework. The two `test:*` scripts are plain `node:assert` files;
verify features beyond them by running the dev server.

## Architecture

### Stack
- **Next.js 16 App Router** with React 19 and React Compiler (`reactCompiler: true` in next.config.ts)
- **tRPC 11** for type-safe API — all mutations and queries go through tRPC procedures defined in `src/server/routers/`
- **Drizzle ORM** on **Turso / libSQL (SQLite)** — schema in `src/db/schema.ts`, instance in `src/db/index.ts`
- **Cloudflare R2** for image storage — `src/lib/r2.ts`
- **Zod 4** validators in `src/server/validators/` — used for tRPC input schemas
- **Tailwind CSS v4** (`@tailwindcss/postcss`) — no `tailwind.config.js`; config lives in CSS via `@theme`
- **Biome** (not ESLint/Prettier) for linting and formatting

### Request Flow

Public landing page → React Server Component fetching `getLandingData()` in
`src/server/services/queries.ts` (direct DB read, no tRPC round-trip).

Admin pages → **fully CSR**: the layout is a synchronous RSC, pages are
`"use client"` components calling tRPC hooks → `src/server/routers/` →
`src/server/services/business.ts` for the rules. Instant shell render with
client-side skeletons.

tRPC handler is at `src/app/api/trpc/[trpc]/route.ts`. Routers are combined in
`src/server/routers/_app.ts`.

tRPC React client is at `src/lib/trpc.ts` (`createTRPCReact<AppRouter>()`). The
`<Providers>` component (`src/components/providers.tsx`) wraps the admin layout
with `QueryClientProvider` + `api.Provider`.

### Auth

Admin-only procedures use `adminProcedure` (`src/server/trpc.ts`), which checks
the session cookie and `role === "admin"`. `publicDbProcedure` is for the CMS
read used by the public site.

`src/proxy.ts` (Next.js 16's renamed Middleware — it must live beside `app`, so
inside `src/`) does a fast cookie check and bounces anonymous `/admin/*` traffic
to `/admin/login`. Full validation happens in
`src/components/admin/admin-auth-guard.tsx`.

The entire admin portal is under `src/app/admin/(portal)/` — this route group
wraps every page with `AdminShell`.

### Demo Mode

When `TURSO_CONNECTION_URL` is not set, the landing page falls back to
`src/lib/demo-data.ts` so the public site renders without a database.

### UI Components

**Reach for a shadcn/ui component first.** Before hand-rolling any primitive —
switch, tabs, popover, tooltip, dropdown, checkbox, radio — pull it in:

```bash
npx shadcn@latest add switch
```

`components.json` is configured for this repo (new-york, stone base, utility
classes not CSS variables, `@/components/ui`, lucide icons), so the CLI drops
files straight into `src/components/ui/`. Repaint the generated classes into the
admin palette (stone surfaces, `red-700` accents, `focus-visible:ring-4
ring-red-600/20`) the way `switch.tsx` and `dialog.tsx` do — the API and
structure stay shadcn's, only the colours are ours.

Hand-roll only when no shadcn primitive covers the need (`Card`, `PageHeader`,
`TableWrap` are ours because shadcn has no equivalent shape).

**Tables go through `DataTable`.** `src/components/ui/data-table.tsx` wraps
TanStack Table v9 (`useTable` + `tableFeatures`, sorting is the only feature
registered) around the shadcn table primitives in `src/components/ui/table.tsx`.
No page writes `<table>`/`<thead>`/`<tr>` by hand. Build columns with the
pre-bound `columnHelper<Row>()` — `helper.accessor` for plain values (these are
the ones that can sort), `helper.display` for JSX/action cells. Props cover what
the hand-rolled tables used to do: `empty`, `sortable`, `dense` (drops the 760px
floor for tables sitting in a grid column), `rowClassName`, `renderSubRow` (the
full-width inline edit row on Packages) and `footer` (raw `<TableRow>` totals,
which carry their own `colSpan`). Pass `getRowId` so keys survive a re-sort.

### Adding New Admin Pages

All pages in `src/app/admin/(portal)/` are client components (`"use client"`):

```tsx
"use client";
import { api } from "@/lib/trpc";

export default function MyPage() {
  const { data, isLoading } = api.router.procedure.useQuery();
  const mutation = api.router.action.useMutation({
    onSuccess: () => {
      toast.success("Action successful.");
      utils.router.procedure.invalidate()
    },
  });

  if (isLoading) return <div className="animate-pulse ...">/* skeleton */</div>;
  return /* JSX */;
}
```

- Skeleton keys must be string literals (`["a","b","c"].map(k => <div key={k}.../>)`), never array indices
- Server actions are kept only for file uploads (`src/app/admin/(portal)/actions.ts`); all other mutations go through tRPC
- For dialogs/child components that trigger mutations: pass an `onSuccess?: () => void` prop so the parent can invalidate the relevant query cache
- Shared pure helpers live in `src/app/admin/(portal)/admin-format.ts` (labels, money conversion, package status, week maths, CSV export)
- **Create actions are dialogs, never inline forms.** A list page shows the rows plus one "Add …" trigger; the create form lives in a `<Dialog>` that closes on success. Radix unmounts the dialog content, so the form resets itself — no `form.reset()`
- The CMS page follows this: every create form is a self-contained component in `src/app/admin/(portal)/cms/add-dialogs.tsx` (`AddWhyDialog`, `AddClassDialog`, `AddGalleryDialog`, `AddReviewDialog`, `AddFaqDialog`, `AddSocialDialog`), each owning its own open state and create mutation. `page.tsx` renders `<AddXDialog sortOrder={data.x.length} />` and keeps only the list/edit/delete UI. Editing an existing row stays inline in the collapsible `EditRow`

### Business Rules (preserve these)

All enforced in `src/server/services/business.ts`, covered by `bun test:business`:

- **Capacity** is checked before a roster row is written (`assertSessionHasCapacity`)
- **Credits burn on `attended` only**, never on booking, and exactly once —
  `session_attendees.creditDeducted` guards both the burn and the refund, so a
  double-click can neither double-burn nor mint credits
- **Expiry blocks check-in** for all three package types
- **Remaining credits are derived** (`totalCredits - usedCredits`), never stored
- **The ledger is the only place money is counted.** `ledger_entries` holds both
  directions — income and expense — as one flat daily book, and every report
  figure comes from it
- **A paid invoice books its income row.** Setting `status = "paid"` requires a
  payment method, stamps `paidDate`, and inserts the matching ledger row;
  moving the invoice back to pending or cancelled removes it. The unique index
  on `ledger_entries.invoice_id` makes a double-click harmless. Rows carrying an
  `invoiceId` are read-only in the ledger UI
- **Categories are data, not an enum.** `ledger_categories` is admin-editable
  (add / rename / archive). A category in use can only be archived, and the two
  slugged rows — `package_sale`, `coach_salary` — are load-bearing: renameable,
  never deletable. Per-coach salary reporting finds them by slug
- Reports are computed on read from `ledger_entries`; nothing is stored
- Money is integer **cents** everywhere
- WhatsApp links are generated via `whatsappLink` in `src/lib/utils.ts` (Malaysian format)

### Database

Turso / libSQL. Local development uses a file database:
`TURSO_CONNECTION_URL=file:./local.db` in `.env.local` (no auth token).
Production uses `libsql://<db>.turso.io` plus `TURSO_AUTH_TOKEN`.
See `.env.example`.

### Path Alias
`@/*` maps to `./src/*`.
