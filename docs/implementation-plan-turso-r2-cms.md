# Implementation Plan — Turso + R2, Management System Admin, Homepage Revamp

**Status:** implemented on `feat/turso-r2-cms-only` (2026-08-14) — see the implementation notes at the end
**Branch:** `feat/turso-r2-cms-only`
**Date:** 2026-08-14 (revision 3)

Scope agreed with the client:

1. Drop Supabase → **Turso (libSQL/SQLite)** for the database, **Cloudflare R2** for image storage.
2. Delete the entire member portal — **the admin runs every flow himself**.
3. Rebuild the admin portal as the **Hercules Factory Management System**:
   `Customer → Package → Trial Conversion → Invoice → Income/Expense → Reports`,
   plus the landing-page CMS.
4. Rebuild the homepage around new copy, with a proper design system and motion.

> **Changed in revision 2.** Revision 1 reduced the admin portal to CMS-only and dropped
> every business table. That is reversed. The admin portal is the product; it is
> *rebuilt*, not deleted. Only the member-facing self-service flows (member portal,
> public booking, member-driven schedule/attendance) go away, because the admin does
> all data entry.
>
> **Changed in revision 3** (client answers): a real Schedule calendar with per-class
> attendance rosters is in scope; PT packages expire like the others; `coaches` is a real
> table with per-coach reporting; the existing Excel data gets imported.

---

## Table of contents

- [Decisions locked](#decisions-locked)
- [The flow](#the-flow)
- [Hallmark design picks](#hallmark-design-picks)
- [Pre-flight findings](#pre-flight-findings)
- [Phase 0 — Branch](#phase-0--branch)
- [Phase 1 — Deletions](#phase-1--deletions)
- [Phase 2 — Postgres → Turso, schema rebuild](#phase-2--postgres--turso-schema-rebuild)
- [Phase 3 — Supabase Storage → Cloudflare R2](#phase-3--supabase-storage--cloudflare-r2)
- [Phase 4 — Admin portal → management system](#phase-4--admin-portal--management-system)
- [Phase 5 — Homepage revamp](#phase-5--homepage-revamp)
- [Phase 6 — Docs and verification](#phase-6--docs-and-verification)
- [Phase 7 — Excel import](#phase-7--excel-import-one-off)
- [Business rules](#business-rules)
- [Blockers — needed from the client](#blockers--needed-from-the-client)
- [Open decisions](#open-decisions)
- [Risks](#risks)
- [Environment variables](#environment-variables)

---

## Decisions locked

| Question | Answer |
| --- | --- |
| Admin portal | **Management system** — Dashboard, Schedule, Customers, Packages, Trials, Invoices, Expenses, Coaches, Reports, CMS |
| Member portal | deleted — every flow is admin-driven |
| Public routes to remove | `/book`, `/pricing`, `/schedule` (homepage CTA is WhatsApp only) |
| Member self-service booking / attendance / QR check-in | deleted |
| Package types | `unlimited`, `credit` (10-credit), `pt` — **all three carry an expiry date** |
| Schedule | full calendar view with a per-class attendance roster |
| Coaches | real `coaches` table + per-coach reporting |
| Existing Excel data | imported via a one-off CSV importer (column layout still needed) |
| Income | **derived**, not a second table — a paid invoice *is* an income row |
| Expenses | one table, fixed category list |
| Reports | monthly + annual, computed on read; nothing stored |
| Data migration | fresh start, seed script only |
| Visual direction | Atmospheric · Midnight — dark, cinematic |
| Animation | zero new dependencies (CSS + IntersectionObserver) — pending confirmation |

---

## The flow

```
Customer  ──▶  Package  ──▶  Trial Conversion  ──▶  Invoice  ──▶  Income / Expense  ──▶  Reports
   │             │                 │                   │                 │                  │
 profile     unlimited /      trial session       number, amount,     paid invoice      monthly:
 + source    credit / pt      → becomes a         discount, method,   = income          income,
             start/expiry     paying package      paid | pending      + expenses        expense,
             + credits                                                                  net profit
                                                                                        + annual

           ▲                                                              ▲
           └────── Schedule: sessions + attendance rosters ───────────────┘
                   credits burn here          coach salary lands here
```

The Excel behaviour the client has today is preserved: **you never key income in twice.**
Marking an invoice `paid` is what puts money into the books.

---

## Hallmark design picks

```
Genre            atmospheric  (dark, physical, photographic)
Macrostructure   Marquee Hero
Nav archetype    N5 floating pill
Footer archetype Ft5 statement
Theme            Midnight (atmospheric cluster)
Enrichment       none — real photography + CSS grain overlay (Tier A)
Motion           reveal-stagger · hover-lift · accordion-expand   (3 primitives, the cap)
Diversification  first Hallmark run in this project — no prior stamp to rotate against
```

**Typography** — the project currently ships **no** font stack (`ui-sans-serif, system-ui` only). New pairing via `next/font/google`:

- Display: **Archivo Condensed**
- Body: **Inter Tight**

2+1 font discipline. No third face. All headings roman — no italic display type.

Hallmark applies to the **public homepage only**. The admin portal keeps its existing
`Card` / `SectionHeader` / table language — it is a data tool, and re-skinning it is
work the client is not paying for.

---

## Pre-flight findings

| Signal | Finding |
| --- | --- |
| Framework | Next.js 16.3.0 App Router, React 19.2.4, React Compiler on (`next.config.ts`) |
| Font stack | **none** — `ui-sans-serif, system-ui` (`src/app/globals.css:12`). No `next/font`, no Google Fonts. |
| Palette | 2 vars (`--background #0f0c0a`, `--foreground #f7f0e4`) + Tailwind v4 `@theme inline`. Page colours are raw `stone/red/amber` utilities. |
| Motion | **no library** (motion-cut). No framer-motion, gsap, or lenis. |
| Design system | no `design.md`, no `.hallmark/` → first Hallmark run |

**Database / storage reality**

- Drizzle uses the `postgresql` dialect with the `postgres-js` driver: 13 tables, 4 migrations, 5 × `pgEnum`, `uuid().defaultRandom()`, `timestamp`, `date`, `time`, `boolean`. Turso is SQLite, so `src/db/schema.ts` is a **full rewrite** and migration history resets.
- Supabase appears in exactly one call site — `uploadGalleryImageAction` in `src/app/admin/(portal)/actions.ts`, plus `src/lib/supabase.ts`. Small swap.
- better-auth uses `provider: "pg"`; becomes `"sqlite"`, and its four tables need SQLite column types.
- Existing admin pages worth keeping as a starting point: `customers/page.tsx` (129 lines), `invoices/page.tsx` (215) + `invoice-dialogs.tsx` (181), `reports/page.tsx` (156), `page.tsx` dashboard (101). They are extended, not rewritten from zero.

---

## Phase 0 — Branch

```bash
git checkout -b feat/turso-r2-cms-only
```

Nothing lands on `main` until the client has run it locally.

---

## Phase 1 — Deletions

Smaller than revision 1. Only member-facing self-service goes.

### Routes

- `src/app/member/` — entire tree
- `src/app/admin/(portal)/` — delete `attendance/` and `bookings/` (both fold into the
  session detail roster)
- `src/app/book/`, `src/app/pricing/`, `src/app/schedule/`

**Kept and extended:** `admin/page.tsx` (dashboard), `admin/customers/`, `admin/invoices/`, `admin/reports/`, `admin/cms/`.
**Kept, rewritten:** `admin/schedule/` — becomes the calendar + roster page.
**Renamed:** `admin/memberships/` → `admin/packages/`.
**New:** `admin/trials/`, `admin/expenses/`, `admin/coaches/`.

### Components

- `src/components/member/` (3 files)
- `src/components/admin/session-qr-dialog.tsx` (QR check-in is gone)
- `src/components/admin/approve-membership-dialog.tsx` — member self-signup approval is gone; the dialog is replaced by the admin's own "sell package" dialog

### Server

- `src/server/routers/` — delete `attendance`, `booking`, `portal`. Keep and extend `customer`, `invoice`, `payment`, `report`, `cms`, `schedule`. Rename `membership` → `package`. Add `trial`, `expense`, `coach`.
- `src/server/validators/` — delete `booking`. Keep `customer`, `invoice`, `membership`→`package`, `schedule`, `cms`, `common`. Add `trial`, `expense`, `coach`.
- `src/server/services/business.ts` — kept and trimmed: capacity check, credit deduction and expiry checks all stay (see [Business rules](#business-rules))
- `src/server/services/queries.ts` — trim to `getLandingData()` only; admin data all flows through tRPC
- `src/server/trpc.ts` — drop `sessionProcedure` and `customerProcedure`; keep `publicProcedure`, `publicDbProcedure`, `adminProcedure`

### Lib and infrastructure

- `src/lib/supabase.ts`
- `src/lib/invoice-pdf.ts` — **kept**; invoices still need a PDF
- `docker-compose.yml`
- `drizzle/*.sql` and `drizzle/meta/` — migration history resets
- `scripts/seed.ts` rewritten; `scripts/set-admin-roles.ts` and `scripts/debug-auth.ts` deleted; `scripts/create-admin.ts` kept

### Auth

- `src/lib/auth.ts` — drop `socialProviders.google` (admin-only; email + password is sufficient); `provider: "pg"` → `"sqlite"`
- `middleware.ts` — drop all `/member` branches; matcher becomes `["/admin/:path*"]`

### Dependencies

**Remove:** `@supabase/supabase-js`, `postgres`, `qrcode.react`, `@yudiel/react-qr-scanner`, `@types/qrcode`
**Keep:** `jspdf` (invoice PDF)
**Add:** `@libsql/client`, `@aws-sdk/client-s3`

---

## Phase 2 — Postgres → Turso, schema rebuild

Not a config flip. `src/db/schema.ts` is Postgres-specific throughout and needs a full
rewrite against `drizzle-orm/sqlite-core` — and the business tables are being reshaped
at the same time.

### Type mapping

| Postgres | SQLite / Turso |
| --- | --- |
| `uuid("id").defaultRandom()` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `timestamp(...)` | `integer(..., { mode: "timestamp" })` + `$defaultFn(() => new Date())` |
| `boolean(...)` | `integer(..., { mode: "boolean" })` |
| `pgEnum` | `text("col", { enum: [...] })` — same type-safety, no separate DDL object |
| `date` | `text("col")` holding `YYYY-MM-DD` — sorts and compares correctly as text |
| `time` | not needed |

Money stays `integer` **cents** everywhere. No floats in the books.

### Final table list (18)

```
auth_user, auth_session, auth_account, auth_verification    (better-auth, sqlite types)

customers            reshaped
customer_packages    replaces `memberships` + `packages`
sessions             replaces `class_sessions`
session_attendees    replaces `bookings` + `attendance_records`
coaches              reshaped (was a CMS-only table)
invoices             reshaped
expenses             new

landing_page_content
gallery_images
why_items            new
class_offerings      new
faq_items            new
social_links
```

Dropped: `packages` (catalogue), `memberships`, `bookings`, `attendance_records`,
`payments`, `users`, `testimonials`.

> `payments` is dropped because an invoice has exactly one payment in this business —
> the payment fields fold into `invoices` (`paymentMethod`, `paidDate`). One row, one
> truth, no join to compute income.

### `customers`

```
id, name, phone (unique), age, gender ("male" | "female" | "other"),
emergencyContact, dateJoined (YYYY-MM-DD), notes,
source ("instagram" | "xiaohongshu" | "whatsapp" | "walk_in" | "referral" | "other"),
createdAt, updatedAt
```

`email` and `authUserId` are dropped — no member login exists any more.

### `customer_packages`

One row per package sold to one customer. Replaces the catalogue + membership split;
the client sells three shapes and prices them per deal, so a catalogue table is dead weight.

```
id, customerId,
type          "unlimited" | "credit" | "pt"
startDate     YYYY-MM-DD
expiryDate    YYYY-MM-DD               notNull — all three types expire
totalCredits  int | null               (10 for a 10-credit pack, session count for PT;
                                        null only for unlimited)
usedCredits   int default 0
amountPaidCents
paymentMethod "cash" | "bank_transfer" | "tng" | "card" | "other"
convertedFromSessionId  → sessions.id | null   (set when a trial converts)
notes, createdAt, updatedAt
```

`remainingCredits` is **not stored** — it is `totalCredits - usedCredits`, computed in
the query. Status (`active` / `expiring` / `expired`) is derived from `expiryDate` and
remaining credits, not a column that can go stale.

Display matches the client's examples exactly:

```
Unlimited     Start 01/08/26 · Expiry 01/09/26 · Active
10 Credits    Total 10 · Used 6 · Remaining 4 · Expiry 04/09/26
PT            Total 10 · Used 7 · Remaining 3 · Expiry 04/09/26
```

### `sessions`

One row per slot on the calendar — group class, PT slot, or trial slot. Feeds
今日课程 / 今日 PT / 今日 Trial / Upcoming Trial.

```
id
type        "class" | "pt" | "trial"
title       text                       ("Muay Thai Class", "PT — Ah Meng", …)
date        YYYY-MM-DD
startTime   text "HH:MM"
endTime     text "HH:MM"
capacity    int default 24             (1 for pt/trial)
coachId     → coaches.id | null
isCancelled, cancellationReason
notes, createdAt, updatedAt
```

Indexed on `(date)` and unique on `(date, startTime, coachId)` so one coach cannot be
double-booked.

### `session_attendees`

The roster. One row per customer in a session — group class, PT, or trial all use the
same path, so there is no per-type branch in the check-in code.

```
id
sessionId   → sessions.id  (cascade)
customerId  → customers.id (cascade)
packageId   → customer_packages.id | null   (null for a trial)
status      "booked" | "attended" | "no_show" | "cancelled" | "converted"
creditDeducted  boolean default false
checkedInAt timestamp | null
notes, createdAt, updatedAt
```

Unique on `(sessionId, customerId)`. `converted` only applies inside a trial session.
`creditDeducted` is what makes the credit rules reversible — see [Business rules](#business-rules).

### `coaches`

```
id, name, phone | null, photoUrl | null, bio | null,
isActive boolean default true, sortOrder,
createdAt, updatedAt
```

Used three ways: assigned to a session, shown on the homepage if a coaches section is
added later, and joined to `expenses.coachId` for per-coach salary reporting.

### `invoices`

```
id, invoiceNumber (unique, HF-YYYY-NNNN)
customerId, packageId → customer_packages.id | null
description
subtotalCents, discountCents, totalCents
status        "pending" | "paid" | "cancelled"
paymentMethod "cash" | "bank_transfer" | "tng" | "card" | "other" | null
issueDate, dueDate | null, paidDate | null
notes, createdAt, updatedAt
```

**Income is this table.** `status = "paid"` + `paidDate` is an income row. There is no
`income` table and no copy step — the same rule as the client's Excel, where a paid
invoice lands in the income sheet by itself.

### `expenses`

```
id
date        YYYY-MM-DD
category    "rent" | "utilities" | "coach_salary" | "marketing"
            | "equipment" | "cleaning" | "maintenance" | "other"
amountCents
coachId     → coaches.id | null    (set when category = "coach_salary")
vendor | null, notes | null
receiptUrl | null          (R2, optional)
createdAt, updatedAt
```

`coachId` is what makes per-coach reporting possible without a second payroll table:
salary rows carry the coach, everything else leaves it null.

### CMS tables

**`landing_page_content`** — extended; the `about*` fields are dropped.

```
heroKicker        "HERCULES FACTORY"
heroHeadline      "MUAY THAI FOR EVERYONE"
heroSubtitle      "Beginners. Fitness. Fighters."
primaryCtaText    "BOOK A CLASS"
whatsappPhone     Malaysian format, fed to whatsappLink()
whatsappMessage   "Hi! I'd like to book a Muay Thai class at Hercules Factory. 😊"
whyTitle          "Why Hercules Factory"
classesTitle      "Classes"
galleryTitle      "Gallery / Training"
faqTitle          "FAQ"
locationTitle · locationAddress · mapEmbedUrl   (kept)
```

**`why_items`** — `emoji, title, sortOrder, isActive`. Seeds the five pillars:

| Emoji | Title |
| --- | --- |
| 🥊 | Beginner Friendly |
| 🔥 | Weight Loss & Fitness |
| 👊 | Authentic Muay Thai Training |
| ❤️ | Female Friendly |
| 🏆 | Structured Coaching |

**`class_offerings`** — `name, description, imageUrl, whatsappMessage, sortOrder, isActive`.

| Name | Description |
| --- | --- |
| GROUP CLASS | 适合想锻炼、减脂、零基础的人 |
| KIDS CLASS | 5–10 岁儿童 |
| PERSONAL TRAINING | 一对一 / 成人 / 儿童 |

**`faq_items`** — `question, answer, sortOrder, isActive`. Seeds four entries:

| Question | Answer |
| --- | --- |
| I've never trained Muay Thai before. Can I join? | Yes! Our classes are beginner-friendly. |
| Do I need my own gloves? | No. Gloves are available for use during your trial/class. |
| Can women join? | Absolutely. We welcome beginners of all fitness levels. |
| How do I book a trial class? | Simply WhatsApp us and we'll help you choose a suitable class. |

**`gallery_images`** — adds a **`category`** column: 团体课, 女生友好训练, 儿童, PT, Sparring, 教练教学.

### Configuration

```ts
// drizzle.config.ts
dialect: "turso",
dbCredentials: {
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
}
```

```ts
// src/db/index.ts
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
```

Local dev uses `TURSO_CONNECTION_URL=file:./local.db` with no auth token. Production uses
`libsql://<db>.turso.io` plus a token. The `getDb()` null-guard and demo-mode fallback stay.

### Bring-up sequence

```bash
bun db:generate      # fresh 0000 migration
bun db:migrate
bun db:create-admin
bun db:seed
```

---

## Phase 3 — Supabase Storage → Cloudflare R2

Two call sites after this plan: gallery images and (optional) expense receipts.

New `src/lib/r2.ts`:

```ts
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

uploadImage(file, prefix)  // PutObjectCommand, key `${prefix}/${crypto.randomUUID()}.${ext}`
                           // returns `${R2_PUBLIC_BASE_URL}/${key}`
deleteImage(url)           // DeleteObjectCommand, called when the row is deleted
```

The delete path is new — the Supabase version left orphaned objects behind whenever a
gallery row was removed.

Upload stays a **server action**, per `CLAUDE.md` (server actions are reserved for file
uploads; every other mutation goes through tRPC).

`next.config.ts` gains an `images.remotePatterns` entry for the R2 public host, and the
gallery moves from raw `<img>` to `next/image`.

### Client-side setup required on Cloudflare

1. Create the R2 bucket.
2. Create an R2 API token (Object Read & Write).
3. **Enable public access** — either the `r2.dev` subdomain or a custom domain.
   `R2_PUBLIC_BASE_URL` does not exist otherwise.

---

## Phase 4 — Admin portal → management system

Title everywhere becomes **Hercules Factory Management System**.

`src/components/admin/admin-nav.tsx` — new link set, ordered by the flow:

```
Dashboard · Schedule · Customers · Packages · Trials · Invoices · Expenses · Coaches · Reports · CMS
```

Every page stays `"use client"` + tRPC hooks + skeleton loading, per `CLAUDE.md`.

### 4.1 Dashboard (`/admin`)

Eleven tiles, all from one `report.dashboard` procedure (single round-trip, one SQL batch):

| Tile | Source |
| --- | --- |
| 今日课程 | `sessions` where `type='class'` and `date = today` (not cancelled) |
| 今日 PT | `sessions` where `type='pt'` and `date = today` |
| 今日 Trial | `sessions` where `type='trial'` and `date = today` |
| 今日新客户 | `customers` where `dateJoined = today` |
| 今日收入 | `invoices` where `status='paid'` and `paidDate = today` |
| 本月收入 | same, month-to-date |
| 本月支出 | `expenses` month-to-date |
| 本月净收入 | 本月收入 − 本月支出 |
| 即将到期的会员 | `customer_packages` expiring within 14 days, or ≤ 2 credits left |
| 未付款 / 欠款 | `invoices` where `status='pending'` — count + total, listed |
| Upcoming Trial | `sessions` where `type='trial'`, `date >= today`, `status='scheduled'` — listed |

### 4.2 Schedule (`/admin/schedule`)

**Week view** — 7 columns × time rows, each session a block coloured by type
(class / pt / trial) with `attended / capacity` and the coach's name. Arrow keys and a
date picker move the week; a Day toggle gives a single-column list for busy days.
No calendar library — CSS grid with `grid-row` spans off `startTime`/`endTime`.

**Create session** — type, title, date, start/end time, capacity, coach. A
*"repeat weekly until <date>"* checkbox writes the rows in one loop, since the client's
timetable is the same every week.

**Session detail / attendance roster** — the sheet the coach works from:

- Add a customer to the roster (search by name/phone); their active package is picked
  automatically, and capacity is enforced before the row is written
- Per row: `Attended` · `No show` · remove. `Attended` burns one credit for
  `credit`/`pt` packages; un-marking gives it back
- Rows show remaining credits after the burn, and flag an expired or empty package in red
  before the check-in is allowed
- Mark whole session attended in one click

`bookings/` and `attendance/` disappear as pages — both were views onto this one screen.

### 4.3 Customers (`/admin/customers`)

Table + create/edit dialog over the new field set (name, phone, age, gender, emergency
contact, date joined, source, notes). Search by name/phone. Source is a select with the
five fixed options. Row click → customer detail showing packages, sessions, and invoices.

WhatsApp button per row via the existing `whatsappLink` helper.

### 4.4 Packages (`/admin/packages`)

Sell a package to a customer: type, start date, expiry, total credits, amount paid,
payment method. Optionally ticks *"create invoice"*, which writes the invoice in the same
mutation.

List shows the client's three display shapes with a computed status badge and a remaining-credit
bar. Filters: active / expiring / expired, and by type.

### 4.5 Trials (`/admin/trials`)

A filtered view of the roster where the session `type='trial'` — the same data as the
Schedule page, listed as a pipeline instead of a calendar. Book a trial (customer + date +
time + coach), mark `attended` / `no_show`, and **Convert** → opens the sell-package dialog
pre-filled with that customer; on success the attendee row flips to `converted` and the new
package records `convertedFromSessionId`.

Conversion rate (converted ÷ total trials, by month) surfaces in Reports.

### 4.6 Invoices (`/admin/invoices`)

Existing page extended: customer, package, description, subtotal, **discount**, total,
payment method, status, invoice number, issue date. `Mark as paid` sets `status='paid'`
and `paidDate` — that single click is what books the income.

Invoice number auto-generates as `HF-YYYY-NNNN`. PDF export keeps `src/lib/invoice-pdf.ts`.

### 4.7 Expenses (`/admin/expenses`)

Table + dialog: date, category (the eight fixed options), amount, vendor, notes, optional
receipt upload to R2. Month filter, category filter, category subtotals in the footer row.

### 4.8 Coaches (`/admin/coaches`)

Table + dialog: name, phone, photo (R2), bio, active toggle, sort order. Per-coach panel
shows sessions taught this month (split class / pt / trial), attendee headcount, trials
converted, and salary paid — the last from `expenses` where `category='coach_salary'` and
`coachId` matches.

### 4.9 Reports (`/admin/reports`)

- **Monthly** — Total Income · Total Expenses · Net Profit, plus income split by package
  type, expenses split by category, new-customer count, trial-conversion rate, and the
  per-coach table (sessions taught · headcount · trials converted · salary).
- **Annual (2026)** — the same three numbers per month in one 12-row table with a totals
  row, plus a bar chart of monthly net profit.
- **CSV export** on both, so the client can keep reconciling against the old spreadsheet
  during the first months.

Every figure is computed on read from `invoices` and `expenses`. Nothing is stored, so
correcting a back-dated invoice fixes the report automatically.

### 4.10 CMS (`/admin/cms`)

Sections: Hero · Why · Classes · Gallery · FAQ · Location · Social.
**CMS mutations move from server actions to tRPC** — the CMS page is the last server-action
holdout and `CLAUDE.md` requires tRPC for everything but uploads. `cmsRouter` grows full
CRUD plus `reorder` for `why_items`, `class_offerings`, `faq_items`, `gallery_images`,
`social_links`. `actions.ts` shrinks to just `uploadImageAction`.

---

## Phase 5 — Homepage revamp

### Tokens

A new `tokens.css`, appended into `src/app/globals.css` **below** `@import "tailwindcss"`
— the existing entry stylesheet is never clobbered.

```css
--color-paper     oklch(14% .01 40)   /* near-black, warm-shifted */
--color-ink       oklch(96% .01 85)
--color-accent    oklch(58% .19 28)   /* ember red */
--color-accent-2  oklch(80% .13 78)   /* brass, used in at most 2 places */
--font-display    /* Archivo Condensed */
--font-body       /* Inter Tight */
--space-* · --text-* · --ease-* · --dur-*
```

Every colour and `font-family` in the page references a token. No inline hex or OKLCH
values anywhere in the component tree.

### DOM order

| # | Section | Notes |
| --- | --- | --- |
| 1 | **Nav** (N5 floating pill) | Logo · Why / Classes / Gallery / FAQ · `BOOK A CLASS` → WhatsApp. Scroll-morph shrink. |
| 2 | **Hero** | Full-bleed photo, grain + gradient scrim. `HERCULES FACTORY` kicker → `MUAY THAI FOR EVERYONE` at `--text-display` → `Beginners. Fitness. Fighters.` → single CTA to `wa.me` with the exact prefilled message. |
| 3 | **Why Hercules Factory** | 5 pillars, staggered reveal, hairline accent rules. |
| 4 | **Classes** | 3 tall cards (GROUP / KIDS / PERSONAL TRAINING), each with `ENQUIRE ON WHATSAPP` carrying a per-class message. |
| 5 | **Gallery / Training** | Asymmetric masonry, category label per tile, `minmax(0,1fr)` tracks. |
| 6 | **FAQ** | 4-item accordion, `grid-template-rows: 0fr → 1fr`. No fake chrome. |
| 7 | **Location** | Address + map iframe. |
| 8 | **Footer** (Ft5 statement) | Statement line + Instagram / Facebook. |

Public enquiries arrive on WhatsApp; the admin then creates the customer and trial by hand.
That is the client's actual process — no public booking form is built.

### Animation

Zero new dependencies (recommended):

- `useReveal` IntersectionObserver hook sets a `data-reveal` attribute
- CSS transitions on `opacity` + `translateY(16px)`, staggered via an `--i` custom property
- Hero ken-burns is `transform: scale()` only
- Hover lift is `translateY(-4px)`
- `prefers-reduced-motion: reduce` collapses everything to a ≤150 ms opacity crossfade

Transform and opacity only. No layout-property animation, no bounce or overshoot on UI
state, focus rings never animated.

*Alternative:* add `motion` (framer-motion v12, roughly 35 kB). Recommendation is to skip
it — CSS covers this brief. Client's call.

### Data path

The landing page stays a React Server Component calling `getLandingData()` directly — no
tRPC round-trip. The demo-data fallback in `src/lib/demo-data.ts` is rewritten for the new
content model.

### Also updated

- `src/app/layout.tsx` — metadata refresh + `next/font` wiring
- `src/components/public-header.tsx` — member-login button becomes a WhatsApp CTA; the
  `authClient` dependency is dropped, so it no longer needs to be a client component
- `src/components/public-footer.tsx` — nav links updated
- `src/app/robots.ts` and `src/app/sitemap.ts` — trimmed to `/`

---

## Phase 6 — Docs and verification

- Write `.env.example` (Turso + R2 + better-auth vars)
- Rewrite `CLAUDE.md` and `AGENTS.md`: Postgres → Turso, member-portal section deleted,
  business-rules section replaced with the list below
- Run `bun lint`, then `bun build`, then `bun dev`
- Walk the flow end to end on the dev server: create a coach → create a customer → book a
  trial → convert → package + invoice → mark paid → check the dashboard and monthly report
  move by the right amount → add an expense → check net profit
- Walk the schedule separately: create a weekly recurring class → add the customer to the
  roster → mark attended and confirm one credit burns → un-mark and confirm it comes back →
  fill the session to capacity and confirm the next add is refused → try a check-in on an
  expired package and confirm it is refused
- Walk the homepage at **320 / 375 / 414 / 768 px** — Hallmark hard floor: no horizontal
  scroll, no two-line clickable text, image grid tracks use `minmax(0, 1fr)`
- Run the Hallmark 58-gate slop test
- Write `.hallmark/log.json` and the CSS macrostructure stamp

---

## Phase 7 — Excel import (one-off)

`scripts/import-excel.ts`, run once against the client's export, then deleted from the repo
after go-live. Reads CSV with Node's built-in parsing — no `xlsx` dependency; the client
exports each sheet as CSV.

Order matters, because of the foreign keys:

```
customers  →  customer_packages  →  invoices  →  expenses
```

- Dedupe customers on `phone`; a repeated phone updates the existing row rather than
  inserting a second one
- Money columns parsed to integer cents; a value that will not parse aborts the row and is
  written to `import-errors.csv` instead of being silently zeroed
- Dates normalised to `YYYY-MM-DD`; `DD/MM/YY` (the client's format) is assumed and stated
  in the script header
- Historical invoices with a paid date import as `status='paid'` so past months' reports are
  correct from day one
- Idempotent: re-running against the same file does not duplicate anything
- Dry-run mode prints the counts and the error rows without writing

Sessions and attendance history are **not** imported — burnt credits arrive as the
`usedCredits` figure on each package, which is the number that actually matters.

---

## Business rules

Replaces the old booking rules. These are the invariants to preserve:

1. **Credit deduction on attendance only.** Setting an attendee row to `attended` on a
   `credit`/`pt` package increments `usedCredits` by 1 and sets `creditDeducted`. Adding a
   customer to a roster deducts nothing. Un-marking gives the credit back — and only when
   `creditDeducted` is true, so a double-undo can never mint credits.
2. **No credits, no check-in.** An attendee on a `credit`/`pt` package cannot be marked
   attended when `usedCredits >= totalCredits` — the admin is prompted to sell a renewal.
3. **Expiry blocks attendance.** All three package types carry an `expiryDate`; a package
   past it cannot be used and reads as expired everywhere.
4. **Capacity is enforced before the roster row is written** (`assertClassHasCapacity`,
   kept from the current codebase). PT and trial sessions have `capacity = 1`.
5. **One coach, one slot.** `(date, startTime, coachId)` is unique — no double-booking.
6. **Paid invoice = income.** Income is never entered by hand. Setting `status='paid'`
   requires a `paymentMethod` and stamps `paidDate`; that row is the income entry.
7. **Discount never negative, total never below zero.** `totalCents = subtotalCents − discountCents`,
   validated in Zod at the tRPC boundary.
8. **Trial conversion is one-way.** `converted` is only set when a package row referencing
   that session exists.
9. **Money is integer cents.** No floats anywhere in the money path.
10. WhatsApp links keep using `whatsappLink` in `src/lib/utils.ts` (Malaysian format).

---

## Blockers — needed from the client

1. **WhatsApp number.** Not present anywhere in the repo. The CMS field and a placeholder
   seed will be built, but every CTA on the homepage is dead until the real number is supplied.
2. **Photography.** `public/` contains only favicons and the logo — zero gym photos. Either
   drop files into `public/`, or Unsplash placeholders get seeded (clearly marked for
   replacement) and the real photos are uploaded later through the R2-backed CMS.
3. **The Excel export — blocking Phase 7.** Import is confirmed, but the importer cannot be
   written without the actual file. Needed: one `.xlsx`/`.csv` export per sheet (customers,
   packages, invoices/income, expenses) with the header row intact. Everything else can be
   built while this is outstanding; only Phase 7 waits.
4. **Weekly timetable.** Which classes run on which days and times, and which coach takes
   each — this seeds the recurring sessions instead of the client keying in a month by hand.
5. **Coach list.** Names, and whether photos and bios go on the homepage later.

---

## Open decisions

1. **`testimonials`** is dropped — the new homepage brief has no testimonials section.
2. **Coaches on the homepage.** The `coaches` table exists for the admin side; adding a
   homepage coaches section is a small extra if the client wants one.

---

## Risks

| Risk | Mitigation |
| --- | --- |
| better-auth on SQLite | `provider: "sqlite"` with `integer({ mode: "timestamp" })` is supported, but the session round-trip gets verified before anything is built on top of it. Fallback: store timestamps as ISO `text`. |
| Reports computed on read | Fine at this data volume (single gym, hundreds of rows/year). If it ever slows down, the fix is an index on `invoices.paidDate` and `expenses.date` — both are in the schema from day one. |
| Derived remaining credits | Correct by construction, but every read path must use `totalCredits - usedCredits`; a single shared selector in `src/server/services/` prevents drift. |
| Credit burn / un-burn drift | Check-in and its reversal both write `session_attendees` and `customer_packages`. They run in one Drizzle transaction and key off `creditDeducted`, so a double-click cannot double-burn or mint a credit. |
| Excel import quality | Real spreadsheets have merged cells, blank rows, and typo'd phone numbers. The importer runs dry-run first and rejects bad rows into `import-errors.csv` rather than guessing — the client fixes those by hand. |
| Existing Supabase gallery URLs die | Acceptable given the fresh-start decision, but the live site's current images are gone until re-uploaded through the new CMS. |
| Migration history resets | The old `drizzle/*.sql` files are Postgres dialect and unusable. The existing Postgres database is abandoned, not migrated — the client's explicit choice. |
| drizzle-kit Turso support | `drizzle-kit@0.31.10` is already installed and supports `dialect: "turso"`. No version bump needed. |

---

## Environment variables

```bash
# Database — Turso
TURSO_CONNECTION_URL=          # file:./local.db for dev, libsql://<db>.turso.io for prod
TURSO_AUTH_TOKEN=              # omit for local file: URLs

# Storage — Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=            # r2.dev subdomain or custom domain

# Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Removed: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`.

---

## Implementation notes (2026-08-14)

Built on `feat/turso-r2-cms-only`. Deviations from the plan above, all
deliberate:

| Plan said | Built | Why |
| --- | --- | --- |
| `middleware.ts`, matcher `/admin/:path*` | `src/proxy.ts` | Next.js 16 renamed Middleware to Proxy, and the file must sit beside `app` — i.e. inside `src/`. At the repo root it was silently inert, so anonymous `/admin` never redirected. Fixed. |
| `payments` table dropped, fields folded into `invoices` | as planned | — |
| Display font Archivo Condensed | `Archivo` variable with the `wdth` axis | Google Fonts has no separate "Archivo Condensed" family; the variable font covers it. Body is Inter Tight as planned. |
| CMS reorder for every list | reorder on why/classes/faq/gallery; social has create/update/delete only | Social links are two rows; ordering them is not worth a control. |
| — | `scripts/business.test.ts`, `scripts/import-excel.test.ts` | Two `node:assert` self-checks (`bun test:business`, `bun test:import`) covering credit burn/refund, capacity, expiry, invoice numbering, and the CSV/date/money parsers. |

Verified end to end against a local Turso file database and the running dev
server: sign-in → create customer → sell package with invoice marked paid →
monthly income moved by exactly the invoice total → added to a class roster →
marked attended (one credit burnt) → un-marked (credit returned). Homepage,
`/admin`, `/admin/login`, `robots.txt` all 200; anonymous `/admin` 307s to the
login page.

Still outstanding, unchanged from [Blockers](#blockers--needed-from-the-client):
the real WhatsApp number, real photography (Unsplash placeholders are seeded),
the client's Excel export, the weekly timetable, and the coach list.
