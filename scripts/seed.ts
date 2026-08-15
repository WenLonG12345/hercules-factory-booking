/**
 * Seeds the landing-page CMS plus a small demo of the management system.
 *   bun run db:seed
 *
 * The CMS half replaces its rows, so it is safe to re-run. `--cms-only` skips
 * the demo management data.
 */
import { createClient } from "@libsql/client";
import { eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import {
  classOfferings,
  coaches,
  customerPackages,
  customers,
  expenses,
  faqItems,
  galleryImages,
  invoices,
  landingPageContent,
  sessionAttendees,
  sessions,
  socialLinks,
  testimonials,
  whyItems,
} from "@/db/schema";
import {
  CLASS_ITEMS,
  demoLanding,
  FAQ_ITEMS,
  GALLERY_ITEMS,
  WHY_ITEMS,
} from "@/lib/demo-data";

const url = process.env.TURSO_CONNECTION_URL ?? "file:./local.db";
const db = drizzle(
  createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN }),
);

const iso = (date: Date) => date.toISOString().slice(0, 10);
const shift = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return iso(date);
};

// Placeholder — replace with real gym photography through the CMS.
const UNSPLASH = "https://images.unsplash.com/photo";

/** `--cms-only` skips the demo management data — safe against a live database. */
const cmsOnly = process.argv.includes("--cms-only");

async function main() {
  console.log("Seeding landing page content…");

  // Same copy the no-database fallback renders, minus its placeholder id.
  const { id: _demoId, ...landing } = demoLanding.content;

  // The landing row is a singleton — update it in place so re-seeding a live
  // database can't leave a second, shadowed row behind.
  const existing = await db.select().from(landingPageContent).limit(1);
  if (existing.length) {
    await db
      .update(landingPageContent)
      .set({ ...landing, updatedAt: new Date() })
      .where(eq(landingPageContent.id, existing[0].id));
  } else {
    await db.insert(landingPageContent).values(landing);
  }

  // The CMS lists are replaced, not appended to — re-seeding a live database
  // used to leave a duplicate of every row behind. Visitor-submitted gallery
  // photos are kept; only the seeded ones (submittedBy is null) are cleared.
  await Promise.all([
    db.delete(whyItems),
    db.delete(classOfferings),
    db.delete(faqItems),
    db.delete(testimonials),
    db.delete(socialLinks),
    db.delete(galleryImages).where(isNull(galleryImages.submittedBy)),
  ]);

  await db
    .insert(whyItems)
    .values(WHY_ITEMS.map((item, index) => ({ ...item, sortOrder: index })));

  await db.insert(classOfferings).values(
    CLASS_ITEMS.map(({ imageId, ...item }, index) => ({
      ...item,
      imageUrl: `${UNSPLASH}-${imageId}?auto=format&fit=crop&w=1200&q=70`,
      sortOrder: index,
    })),
  );

  // Opening hours in the last entry come from the Google Business Profile.
  await db
    .insert(faqItems)
    .values(FAQ_ITEMS.map((item, index) => ({ ...item, sortOrder: index })));

  await db
    .insert(galleryImages)
    .values(
      GALLERY_ITEMS.map((item, index) => ({ ...item, sortOrder: index })),
    );

  // Imported from the Google Business Profile (5.0★ from 9 reviews). Only the
  // five reviews Google exposes publicly came across.
  await db.insert(testimonials).values(
    [
      [
        "Inot Tamales",
        "Been there few times, super beginner friendly. Clean and functional environment and very insightful coach.",
        "Jun 2026",
      ],
      ["Maxwell Kee Ming Jie", "very friendly environment", "Sep 2025"],
      [
        "leeping tan",
        "Will go again definitely, place is spacious and location is easy to find.",
        "Aug 2025",
      ],
      ["Teo Wen Long", "Nice coach and friendly environment", "Aug 2025"],
      [
        "Bill Lim",
        "Clean environment. Good class. Easy catch up skill.",
        "Aug 2024",
      ],
    ].map(([author, quote, reviewedAt], index) => ({
      author,
      quote,
      reviewedAt,
      rating: 5,
      source: "Google",
      sortOrder: index,
    })),
  );

  await db.insert(socialLinks).values([
    {
      platform: "instagram",
      label: "Instagram",
      url: "https://instagram.com/herculesfactory_",
      sortOrder: 0,
    },
    {
      platform: "whatsapp",
      label: "WhatsApp",
      url: "https://wa.me/60162723083",
      sortOrder: 1,
    },
  ]);

  if (cmsOnly) {
    console.log("Done (CMS only — demo management data skipped).");
    return;
  }

  console.log("Seeding demo management data…");

  const [coach] = await db
    .insert(coaches)
    .values({ name: "Kru Somchai", phone: "60123456780", sortOrder: 0 })
    .returning();

  const insertedCustomers = await db
    .insert(customers)
    .values([
      {
        name: "Aisyah Rahman",
        phone: "60121112222",
        age: 27,
        gender: "female",
        dateJoined: shift(-40),
        source: "instagram",
      },
      {
        name: "Wei Jie Tan",
        phone: "60123334444",
        age: 32,
        gender: "male",
        dateJoined: shift(-12),
        source: "xiaohongshu",
      },
      {
        name: "Priya Nair",
        phone: "60125556666",
        age: 24,
        gender: "female",
        dateJoined: shift(-2),
        source: "whatsapp",
      },
    ])
    .returning();

  const [unlimited, credit] = await db
    .insert(customerPackages)
    .values([
      {
        customerId: insertedCustomers[0].id,
        type: "unlimited",
        startDate: shift(-40),
        expiryDate: shift(-10),
        totalCredits: null,
        amountPaidCents: 35000,
        paymentMethod: "bank_transfer",
      },
      {
        customerId: insertedCustomers[1].id,
        type: "credit",
        startDate: shift(-12),
        expiryDate: shift(78),
        totalCredits: 10,
        usedCredits: 6,
        amountPaidCents: 30000,
        paymentMethod: "cash",
      },
      {
        customerId: insertedCustomers[0].id,
        type: "pt",
        startDate: shift(-30),
        expiryDate: shift(60),
        totalCredits: 10,
        usedCredits: 7,
        amountPaidCents: 90000,
        paymentMethod: "tng",
      },
    ])
    .returning();

  const year = new Date().getFullYear();
  await db.insert(invoices).values([
    {
      invoiceNumber: `HF-${year}-0001`,
      customerId: insertedCustomers[0].id,
      packageId: unlimited.id,
      description: "Unlimited package",
      subtotalCents: 35000,
      discountCents: 0,
      totalCents: 35000,
      status: "paid",
      paymentMethod: "bank_transfer",
      issueDate: shift(-40),
      paidDate: shift(-40),
    },
    {
      invoiceNumber: `HF-${year}-0002`,
      customerId: insertedCustomers[1].id,
      packageId: credit.id,
      description: "10 credit package",
      subtotalCents: 32000,
      discountCents: 2000,
      totalCents: 30000,
      status: "paid",
      paymentMethod: "cash",
      issueDate: shift(-12),
      paidDate: shift(-12),
    },
    {
      invoiceNumber: `HF-${year}-0003`,
      customerId: insertedCustomers[2].id,
      description: "Trial follow-up package",
      subtotalCents: 30000,
      discountCents: 0,
      totalCents: 30000,
      status: "pending",
      issueDate: shift(-1),
    },
  ]);

  await db.insert(expenses).values([
    {
      date: shift(-20),
      category: "rent",
      amountCents: 450000,
      vendor: "Landlord",
    },
    { date: shift(-18), category: "utilities", amountCents: 42000 },
    {
      date: shift(-15),
      category: "coach_salary",
      amountCents: 280000,
      coachId: coach.id,
    },
    { date: shift(-9), category: "marketing", amountCents: 60000 },
  ]);

  const [groupClass, trialSession] = await db
    .insert(sessions)
    .values([
      {
        type: "class",
        title: "Muay Thai Class",
        date: iso(new Date()),
        startTime: "19:00",
        endTime: "20:00",
        capacity: 24,
        coachId: coach.id,
      },
      {
        type: "trial",
        title: "Trial class",
        date: shift(2),
        startTime: "20:00",
        endTime: "21:00",
        capacity: 1,
      },
    ])
    .returning();

  await db.insert(sessionAttendees).values([
    {
      sessionId: groupClass.id,
      customerId: insertedCustomers[1].id,
      packageId: credit.id,
    },
    { sessionId: trialSession.id, customerId: insertedCustomers[2].id },
  ]);

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
