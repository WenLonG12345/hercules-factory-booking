# Implementation Plan — Turso + R2, CMS-only Admin, Homepage Revamp

**Status:** awaiting approval
**Branch:** `feat/turso-r2-cms-only`
**Date:** 2026-08-12

Scope agreed with the client:

1. Drop Supabase → **Turso (libSQL/SQLite)** for the database, **Cloudflare R2** for image storage.
2. Delete the entire member portal.
3. Reduce the admin portal to landing-page CMS only.
4. Rebuild the homepage around new copy, with a proper design system and motion.

---

## Table of contents

- [Decisions locked](#decisions-locked)
- [Hallmark design picks](#hallmark-design-picks)
- [Pre-flight findings](#pre-flight-findings)
- [Phase 0 — Branch](#phase-0--branch)
- [Phase 1 — Deletions](#phase-1--deletions)
- [Phase 2 — Postgres → Turso](#phase-2--postgres--turso)
- [Phase 3 — Supabase Storage → Cloudflare R2](#phase-3--supabase-storage--cloudflare-r2)
- [Phase 4 — Admin portal → CMS-only](#phase-4--admin-portal--cms-only)
- [Phase 5 — Homepage revamp](#phase-5--homepage-revamp)
- [Phase 6 — Docs and verification](#phase-6--docs-and-verification)
- [Blockers — needed from the client](#blockers--needed-from-the-client)
- [Open decision](#open-decision)
- [Risks](#risks)
- [Environment variables](#environment-variables)

---

## Decisions locked

| Question | Answer |
| --- | --- |
| Admin sections to remove | attendance, bookings, customers, memberships, schedule **plus** invoices, reports, dashboard |
| Public routes to remove | `/book`, `/pricing`, `/schedule` |
| Business tables | dropped from the schema entirely |
| CMS depth | full CMS — new tables for Why / Classes / FAQ, plus WhatsApp fields |
| Data migration | fresh start, seed script only |
| Visual direction | Atmospheric · Midnight — dark, cinematic |
| Animation | zero new dependencies (CSS + IntersectionObserver) — pending confirmation |

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

---

## Pre-flight findings

| Signal | Finding |
| --- | --- |
| Framework | Next.js 16.3.0 App Router, React 19.2.4, React Compiler on (`next.config.ts`) |
| Font stack | **none** — `ui-sans-serif, system-ui` (`src/app/globals.css:12`). No `next/font`, no Google Fonts. |
| Palette | 2 vars (`--background #0f0c0a`, `--foreground #f7f0e4`) + Tailwind v4 `@theme inline`. Page colours are raw `stone/red/amber` utilities. |
| Motion | **no library** (motion-cut). No framer-motion, gsap, or lenis. |
| Spacing | Tailwind default 4pt scale |
| Design system | no `design.md`, no `.hallmark/` → first Hallmark run |

**Database / storage reality**

- Drizzle uses the `postgresql` dialect with the `postgres-js` driver: 13 tables, 4 migrations, 5 × `pgEnum`, `uuid().defaultRandom()`, `timestamp`, `date`, `time`, `boolean`. Turso is SQLite, so `src/db/schema.ts` is a **full rewrite** and migration history resets.
- Supabase appears in exactly one call site — `uploadGalleryImageAction` in `src/app/admin/(portal)/actions.ts`, plus `src/lib/supabase.ts`. Small swap.
- better-auth uses `provider: "pg"`; becomes `"sqlite"`, and its four tables need SQLite column types.

---

## Phase 0 — Branch

```bash
git checkout -b feat/turso-r2-cms-only
```

Deletions in Phase 1 are extensive. Everything below happens on this branch; nothing lands on `main` until the client has run it locally.

---

## Phase 1 — Deletions

### Routes

- `src/app/member/` — entire tree
- `src/app/admin/(portal)/` — delete `attendance/`, `bookings/`, `customers/`, `invoices/`, `memberships/`, `reports/`, `schedule/`
- `src/app/admin/(portal)/page.tsx` — replaced by `redirect("/admin/cms")`
- `src/app/book/`, `src/app/pricing/`, `src/app/schedule/`

### Components

- `src/components/member/` (3 files)
- `src/components/admin/approve-membership-dialog.tsx`
- `src/components/admin/session-qr-dialog.tsx`

### Server

- `src/server/routers/` — delete `attendance`, `booking`, `customer`, `invoice`, `membership`, `payment`, `portal`, `report`, `schedule`. Keep `cms.ts`; rewrite `_app.ts`.
- `src/server/validators/` — delete `booking`, `customer`, `invoice`, `membership`, `schedule`. Keep `cms.ts`, `common.ts`.
- `src/server/services/business.ts` — delete
- `src/server/services/queries.ts` — trim to `getLandingData()` only
- `src/server/trpc.ts` — drop `sessionProcedure` and `customerProcedure`; keep `publicProcedure`, `publicDbProcedure`, `adminProcedure`

### Lib and infrastructure

- `src/lib/supabase.ts`, `src/lib/invoice-pdf.ts`
- `docker-compose.yml`
- `drizzle/*.sql` and `drizzle/meta/` — migration history resets
- `scripts/seed.ts` rewritten; `scripts/set-admin-roles.ts` and `scripts/debug-auth.ts` deleted; `scripts/create-admin.ts` kept

### Auth

- `src/lib/auth.ts` — drop `socialProviders.google` (admin-only; email + password is sufficient); `provider: "pg"` → `"sqlite"`
- `middleware.ts` — drop all `/member` branches; matcher becomes `["/admin/:path*"]`

### Dependencies

**Remove:** `@supabase/supabase-js`, `postgres`, `jspdf`, `qrcode.react`, `@yudiel/react-qr-scanner`, `@types/qrcode`

**Add:** `@libsql/client`, `@aws-sdk/client-s3`

---

## Phase 2 — Postgres → Turso

Not a config flip. `src/db/schema.ts` is Postgres-specific throughout and needs a full rewrite against `drizzle-orm/sqlite-core`.

### Type mapping

| Postgres | SQLite / Turso |
| --- | --- |
| `uuid("id").defaultRandom()` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `timestamp(...)` | `integer(..., { mode: "timestamp" })` + `$defaultFn(() => new Date())` |
| `boolean(...)` | `integer(..., { mode: "boolean" })` |
| `pgEnum` | not needed — all five belonged to business tables being dropped |
| `date` / `time` | not needed — dropped with the schedule feature |

`index` and `uniqueIndex` are available from `sqlite-core` unchanged.

### Final table list (10)

```
auth_user
auth_session
auth_account
auth_verification
landing_page_content
gallery_images
why_items          (new)
class_offerings    (new)
faq_items          (new)
social_links
```

Dropped: `customers`, `packages`, `memberships`, `class_sessions`, `bookings`, `attendance_records`, `invoices`, `payments`, `users`, `coaches`, `testimonials`.

> `coaches` and `testimonials` are in the dropped list because the new homepage brief has no coaches or testimonials section. See [Open decision](#open-decision).

### Schema changes

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
locationTitle     (kept)
locationAddress   (kept)
mapEmbedUrl       (kept)
```

**`why_items`** — `emoji, title, sortOrder, isActive`. Seeds the five pillars:

| Emoji | Title |
| --- | --- |
| 🥊 | Beginner Friendly |
| 🔥 | Weight Loss & Fitness |
| 👊 | Authentic Muay Thai Training |
| ❤️ | Female Friendly |
| 🏆 | Structured Coaching |

**`class_offerings`** — `name, description, imageUrl, whatsappMessage, sortOrder, isActive`. Each row carries its own prefilled enquiry message.

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

**`gallery_images`** — adds a **`category`** column so the six named buckets work: 团体课, 女生友好训练, 儿童, PT, Sparring, 教练教学.

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

Local development uses `TURSO_CONNECTION_URL=file:./local.db` with no auth token. Production uses `libsql://<db>.turso.io` plus a token. The `getDb()` null-guard and demo-mode fallback stay as they are.

### Bring-up sequence

```bash
bun db:generate      # fresh 0000 migration
bun db:migrate
bun db:create-admin
bun db:seed
```

---

## Phase 3 — Supabase Storage → Cloudflare R2

One call site today: `uploadGalleryImageAction` in `src/app/admin/(portal)/actions.ts`.

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

uploadImage(file)  // PutObjectCommand, key `gallery/${crypto.randomUUID()}.${ext}`
                   // returns `${R2_PUBLIC_BASE_URL}/${key}`
deleteImage(url)   // DeleteObjectCommand, called when a gallery image is deleted
```

The delete path is new — the Supabase version left orphaned objects behind whenever a gallery row was removed.

Upload stays a **server action**, per `CLAUDE.md` (server actions are reserved for file uploads; every other mutation goes through tRPC).

`next.config.ts` gains an `images.remotePatterns` entry for the R2 public host, and the gallery moves from raw `<img>` to `next/image`.

### Client-side setup required on Cloudflare

1. Create the R2 bucket.
2. Create an R2 API token (Object Read & Write).
3. **Enable public access** — either the `r2.dev` subdomain or a custom domain. `R2_PUBLIC_BASE_URL` does not exist otherwise.

---

## Phase 4 — Admin portal → CMS-only

- `/admin` → `redirect("/admin/cms")`
- `src/components/admin/admin-nav.tsx` — the nine sidebar links become in-page section anchors: Hero · Why · Classes · Gallery · FAQ · Location · Social
- `src/components/admin/admin-shell.tsx` — sidebar shrinks to a topbar (logo + section tabs + sign out); subtitle copy updated
- `src/components/admin/admin-auth-guard.tsx` — unchanged; role check stays `"admin"`
- **CMS mutations move from server actions to tRPC.** The CMS page is the last server-action holdout, and `CLAUDE.md` specifies that everything except uploads goes through tRPC. `cmsRouter` grows full CRUD plus `reorder` for `why_items`, `class_offerings`, `faq_items`, `gallery_images`, and `social_links`. `actions.ts` shrinks to just `uploadGalleryImageAction`.
- `src/app/admin/(portal)/cms/page.tsx` rewritten (491 lines today) against the new content model, keeping the existing `Card` / `SectionHeader` visual language, skeleton loading states, and `utils.cms.publicContent.invalidate()` on success.

---

## Phase 5 — Homepage revamp

### Tokens

A new `tokens.css`, appended into `src/app/globals.css` **below** `@import "tailwindcss"` — the existing entry stylesheet is never clobbered.

```css
--color-paper     oklch(14% .01 40)   /* near-black, warm-shifted */
--color-ink       oklch(96% .01 85)
--color-accent    oklch(58% .19 28)   /* ember red */
--color-accent-2  oklch(80% .13 78)   /* brass, used in at most 2 places */
--font-display    /* Archivo Condensed */
--font-body       /* Inter Tight */
--space-*         /* 4pt scale */
--text-*
--ease-out | --ease-in | --ease-in-out
--dur-*
```

Every colour and `font-family` in the page references a token. No inline hex or OKLCH values anywhere in the component tree.

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

### Animation

Zero new dependencies (recommended):

- `useReveal` IntersectionObserver hook sets a `data-reveal` attribute
- CSS transitions on `opacity` + `translateY(16px)`, staggered via an `--i` custom property
- Hero ken-burns is `transform: scale()` only
- Hover lift is `translateY(-4px)`
- `prefers-reduced-motion: reduce` collapses everything to a ≤150 ms opacity crossfade

Transform and opacity only. No layout-property animation, no bounce or overshoot on UI state, focus rings never animated.

*Alternative:* add `motion` (framer-motion v12, roughly 35 kB) for physics-based motion. Recommendation is to skip it — CSS covers this brief and keeps the bundle clean. Client's call.

### Data path

The landing page stays a React Server Component calling `getLandingData()` directly — no tRPC round-trip. The demo-data fallback in `src/lib/demo-data.ts` is rewritten for the new content model.

### Also updated

- `src/app/layout.tsx` — metadata refresh + `next/font` wiring
- `src/components/public-header.tsx` — member-login button becomes a WhatsApp CTA; the `authClient` dependency is dropped, so it no longer needs to be a client component
- `src/components/public-footer.tsx` — nav links updated
- `src/app/robots.ts` and `src/app/sitemap.ts` — trimmed to `/`

---

## Phase 6 — Docs and verification

- Write `.env.example` (Turso + R2 + better-auth vars)
- Rewrite `CLAUDE.md` and `AGENTS.md`: Postgres → Turso, delete the business-rules section, delete the member-portal section
- Run `bun lint`, then `bun build`, then `bun dev`
- Walk the homepage at **320 / 375 / 414 / 768 px** — Hallmark hard floor: no horizontal scroll, no two-line clickable text, image grid tracks use `minmax(0, 1fr)`
- Run the Hallmark 58-gate slop test
- Write `.hallmark/log.json` and the CSS macrostructure stamp

---

## Blockers — needed from the client

1. **WhatsApp number.** Not present anywhere in the repo. The CMS field and a placeholder seed will be built, but every CTA on the page is dead until the real number is supplied.
2. **Photography.** `public/` contains only favicons and the logo — zero gym photos. The hero and gallery need real images. Either drop files into `public/`, or Unsplash placeholders get seeded (clearly marked for replacement) and the real photos are uploaded later through the new R2-backed CMS.

---

## Open decision

**Do `coaches` and `testimonials` stay?** The new homepage brief (sections a–e) contains neither, so the current plan drops both tables and their CMS panels. Keeping them dormant instead is a small change — say so before Phase 2 starts.

---

## Risks

| Risk | Mitigation |
| --- | --- |
| better-auth on SQLite | `provider: "sqlite"` with `integer({ mode: "timestamp" })` is supported, but the session round-trip gets verified before anything is built on top of it. Fallback: store timestamps as ISO `text`. |
| Existing Supabase gallery URLs die | Acceptable given the fresh-start decision, but the live site's current images are gone until re-uploaded through the new CMS. |
| Migration history resets | The old `drizzle/*.sql` files are Postgres dialect and unusable. The existing Postgres database is abandoned, not migrated — this is the client's explicit choice. |
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

Removed: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
