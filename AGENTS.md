<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Notes

- This is the Hercules Factory Muay Thai gym management MVP.
- Use Bun scripts from `package.json`.
- Keep App Router routes in `src/app`.
- Keep Drizzle schema changes in `src/db/schema.ts` and generate migrations with
  `bun run db:generate`.
- Preserve the business rules for booking capacity, membership expiry, and
  10-class credit deduction on attended check-in only.
