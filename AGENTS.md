<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project Notes

- This is the **Hercules Factory Management System** — an admin-only gym
  management app plus a public landing page. There is no member portal; the
  admin enters everything.
- Use Bun scripts from `package.json`.
- Keep App Router routes in `src/app`. Request interception lives in
  `src/proxy.ts` (Next.js 16 renamed Middleware to Proxy — the file must sit
  beside `app`, i.e. inside `src/`).
- Database is **Turso (libSQL/SQLite)**. Keep Drizzle schema changes in
  `src/db/schema.ts` and generate migrations with `bun run db:generate`.
- Images go to **Cloudflare R2** via `src/lib/r2.ts`.
- Preserve the business rules in `src/server/services/business.ts`: session
  capacity, package expiry, credit deduction on attended check-in only, and
  "a paid invoice books one income row in the ledger" (`ledger_entries` is the
  single source of truth for money; its unique `invoice_id` keeps that
  booking idempotent).
- Money is integer cents everywhere. No floats in the money path.
- Self-checks: `bun run test:business` and `bun run test:import`.
