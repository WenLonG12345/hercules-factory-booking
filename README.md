# Hercules Factory

Production-ready MVP for a Muay Thai gym management platform. It includes a
public landing and booking flow plus an authentication-protected admin portal
for customers, memberships, schedules, bookings, attendance, invoices, WhatsApp
links, reports, and CMS content.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style local components
- tRPC
- Drizzle ORM
- PostgreSQL

## Getting Started

Install dependencies:

```bash
bun dev
```

Create environment variables:

```bash
cp .env.example .env.local
```

Set `DATABASE_URL` to a PostgreSQL database.

## Local PostgreSQL With Docker

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Confirm the container is healthy:

```bash
docker compose ps
```

The local database URL is:

```txt
postgres://postgres:postgres@localhost:5432/hercules_factory
```

## Database Migration

Generate a Drizzle migration from `src/db/schema.ts`:

```bash
bun run db:generate
```

Apply pending migrations:

```bash
bun run db:migrate
```

Seed sample data:

```bash
bun run db:seed
```

Start development:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Admin Login

Default local credentials:

```txt
Email: admin@herculesfactory.local
Password: password
```

Override with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## Routes

Public:

- `/`
- `/book`
- `/schedule`
- `/pricing`

Admin:

- `/admin`
- `/admin/customers`
- `/admin/customers/[id]`
- `/admin/schedule`
- `/admin/bookings`
- `/admin/attendance`
- `/admin/invoices`
- `/admin/reports`
- `/admin/cms`

## Business Rules

- 10-class packages start with 10 credits and expire after 1 month.
- 10-class credits deduct only when attendance is marked attended.
- Unlimited monthly packages expire after 1 month and do not deduct credits.
- Single class memberships do not create remaining credits.
- Bookings cannot exceed class capacity.
- WhatsApp links use `wa.me` with normalized Malaysia phone numbers.

The app renders demo data without `DATABASE_URL` so the UI can be previewed
immediately. Database mutations require PostgreSQL to be configured.
