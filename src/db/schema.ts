import { relations } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const PACKAGE_TYPES = ["unlimited", "credit", "pt"] as const;
export const PAYMENT_METHODS = [
  "cash",
  "bank_transfer",
  "tng",
  "card",
  "other",
] as const;
export const INVOICE_STATUSES = ["pending", "paid", "cancelled"] as const;
export const SESSION_TYPES = ["class", "pt", "trial"] as const;
export const ATTENDEE_STATUSES = [
  "booked",
  "attended",
  "no_show",
  "cancelled",
  "converted",
] as const;
export const CUSTOMER_SOURCES = [
  "instagram",
  "xiaohongshu",
  "whatsapp",
  "walk_in",
  "referral",
  "other",
] as const;
export const GENDERS = ["male", "female", "other"] as const;
export const EXPENSE_CATEGORIES = [
  "rent",
  "utilities",
  "coach_salary",
  "marketing",
  "equipment",
  "cleaning",
  "maintenance",
  "other",
] as const;

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
};

/**
 * Chinese overrides for a CMS row, keyed by the row's own English column names.
 * A missing or blank key falls back to English — see `localize` in
 * `src/server/services/queries.ts`.
 *
 * One JSON column beats one `*_zh` column per field: adding a third language is
 * a key, not a migration.
 * ponytail: no per-key type safety. Split into real columns only if the CMS
 * ever needs to query or index a translation.
 */
const zh = () => text("zh", { mode: "json" }).$type<Record<string, string>>();

// better-auth tables ---------------------------------------------------------

export const authUser = sqliteTable("auth_user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  image: text("image"),
  role: text("role").default("customer").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const authSession = sqliteTable("auth_session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => authUser.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const authAccount = sqliteTable("auth_account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => authUser.id, { onDelete: "cascade" })
    .notNull(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const authVerification = sqliteTable("auth_verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Management system ----------------------------------------------------------

export const customers = sqliteTable(
  "customers",
  {
    id: id(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    age: integer("age"),
    gender: text("gender", { enum: GENDERS }),
    emergencyContact: text("emergency_contact"),
    dateJoined: text("date_joined").notNull(),
    source: text("source", { enum: CUSTOMER_SOURCES }),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("customers_phone_idx").on(table.phone),
    index("customers_name_idx").on(table.name),
    index("customers_date_joined_idx").on(table.dateJoined),
  ],
);

export const coaches = sqliteTable("coaches", {
  id: id(),
  name: text("name").notNull(),
  phone: text("phone"),
  photoUrl: text("photo_url"),
  bio: text("bio"),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  ...timestamps,
});

export const customerPackages = sqliteTable(
  "customer_packages",
  {
    id: id(),
    customerId: text("customer_id")
      .references(() => customers.id, { onDelete: "cascade" })
      .notNull(),
    type: text("type", { enum: PACKAGE_TYPES }).notNull(),
    startDate: text("start_date").notNull(),
    expiryDate: text("expiry_date").notNull(),
    // null only for unlimited packages
    totalCredits: integer("total_credits"),
    usedCredits: integer("used_credits").default(0).notNull(),
    amountPaidCents: integer("amount_paid_cents").default(0).notNull(),
    paymentMethod: text("payment_method", { enum: PAYMENT_METHODS }),
    convertedFromSessionId: text("converted_from_session_id"),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("customer_packages_customer_idx").on(table.customerId),
    index("customer_packages_expiry_idx").on(table.expiryDate),
  ],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: id(),
    type: text("type", { enum: SESSION_TYPES }).notNull(),
    title: text("title").notNull(),
    date: text("date").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    capacity: integer("capacity").default(24).notNull(),
    coachId: text("coach_id").references(() => coaches.id, {
      onDelete: "set null",
    }),
    isCancelled: integer("is_cancelled", { mode: "boolean" })
      .default(false)
      .notNull(),
    cancellationReason: text("cancellation_reason"),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("sessions_date_idx").on(table.date),
    // A coach cannot be in two places at once. Sessions without a coach are
    // unconstrained — SQLite treats NULLs as distinct in a unique index.
    uniqueIndex("sessions_coach_slot_idx").on(
      table.date,
      table.startTime,
      table.coachId,
    ),
  ],
);

export const sessionAttendees = sqliteTable(
  "session_attendees",
  {
    id: id(),
    sessionId: text("session_id")
      .references(() => sessions.id, { onDelete: "cascade" })
      .notNull(),
    customerId: text("customer_id")
      .references(() => customers.id, { onDelete: "cascade" })
      .notNull(),
    packageId: text("package_id").references(() => customerPackages.id, {
      onDelete: "set null",
    }),
    status: text("status", { enum: ATTENDEE_STATUSES })
      .default("booked")
      .notNull(),
    creditDeducted: integer("credit_deducted", { mode: "boolean" })
      .default(false)
      .notNull(),
    checkedInAt: integer("checked_in_at", { mode: "timestamp" }),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("session_attendees_unique_idx").on(
      table.sessionId,
      table.customerId,
    ),
    index("session_attendees_customer_idx").on(table.customerId),
  ],
);

export const invoices = sqliteTable(
  "invoices",
  {
    id: id(),
    invoiceNumber: text("invoice_number").notNull().unique(),
    customerId: text("customer_id")
      .references(() => customers.id, { onDelete: "cascade" })
      .notNull(),
    packageId: text("package_id").references(() => customerPackages.id, {
      onDelete: "set null",
    }),
    description: text("description"),
    subtotalCents: integer("subtotal_cents").notNull(),
    discountCents: integer("discount_cents").default(0).notNull(),
    totalCents: integer("total_cents").notNull(),
    status: text("status", { enum: INVOICE_STATUSES })
      .default("pending")
      .notNull(),
    paymentMethod: text("payment_method", { enum: PAYMENT_METHODS }),
    issueDate: text("issue_date").notNull(),
    dueDate: text("due_date"),
    paidDate: text("paid_date"),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("invoices_customer_idx").on(table.customerId),
    index("invoices_paid_date_idx").on(table.paidDate),
    index("invoices_status_idx").on(table.status),
  ],
);

export const expenses = sqliteTable(
  "expenses",
  {
    id: id(),
    date: text("date").notNull(),
    category: text("category", { enum: EXPENSE_CATEGORIES }).notNull(),
    amountCents: integer("amount_cents").notNull(),
    coachId: text("coach_id").references(() => coaches.id, {
      onDelete: "set null",
    }),
    vendor: text("vendor"),
    notes: text("notes"),
    receiptUrl: text("receipt_url"),
    ...timestamps,
  },
  (table) => [
    index("expenses_date_idx").on(table.date),
    index("expenses_category_idx").on(table.category),
  ],
);

// Landing page CMS -----------------------------------------------------------

export const landingPageContent = sqliteTable("landing_page_content", {
  id: id(),
  heroKicker: text("hero_kicker").default("HERCULES FACTORY").notNull(),
  heroHeadline: text("hero_headline").notNull(),
  heroSubtitle: text("hero_subtitle").notNull(),
  heroImageUrl: text("hero_image_url"),
  primaryCtaText: text("primary_cta_text").default("BOOK A CLASS").notNull(),
  whatsappPhone: text("whatsapp_phone").notNull(),
  whatsappMessage: text("whatsapp_message").notNull(),
  whyTitle: text("why_title").default("Why Hercules Factory").notNull(),
  classesTitle: text("classes_title").default("Classes").notNull(),
  galleryTitle: text("gallery_title").default("Gallery / Training").notNull(),
  promotionsTitle: text("promotions_title").default("Promotions").notNull(),
  testimonialsTitle: text("testimonials_title")
    .default("What members say")
    .notNull(),
  faqTitle: text("faq_title").default("FAQ").notNull(),
  locationTitle: text("location_title").notNull(),
  locationAddress: text("location_address").notNull(),
  mapEmbedUrl: text("map_embed_url"),
  zh: zh(),
  ...timestamps,
});

export const whyItems = sqliteTable("why_items", {
  id: id(),
  // Emoji is the fallback when no 3D icon has been uploaded yet.
  emoji: text("emoji").notNull(),
  iconUrl: text("icon_url"),
  title: text("title").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  zh: zh(),
  ...timestamps,
});

export const classOfferings = sqliteTable("class_offerings", {
  id: id(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  whatsappMessage: text("whatsapp_message"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  zh: zh(),
  ...timestamps,
});

export const faqItems = sqliteTable("faq_items", {
  id: id(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  zh: zh(),
  ...timestamps,
});

// Visitor submissions land here too, as isActive=false rows with submittedBy
// set — the admin approves by flipping isActive, rejects by deleting. No second
// table, and the landing page's existing isActive filter already hides them.
// ponytail: hiding an approved submission puts it back in the pending list;
// give it its own status column if the admin ever needs a real hide.
export const galleryImages = sqliteTable("gallery_images", {
  id: id(),
  imageUrl: text("image_url").notNull(),
  alt: text("alt").notNull(),
  category: text("category"),
  caption: text("caption"),
  submittedBy: text("submitted_by"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  ...timestamps,
});

// Promotion banners — portrait 9:16 artwork the gym already produces for
// Instagram stories, reused as-is on the landing page.
export const promotions = sqliteTable("promotions", {
  id: id(),
  imageUrl: text("image_url").notNull(),
  title: text("title").notNull(),
  whatsappMessage: text("whatsapp_message"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  ...timestamps,
});

// Reviews pulled from the Google Business Profile. Avatars are deliberately not
// stored — the landing page renders initials, so no third-party image host has
// to be whitelisted in next.config.ts.
export const testimonials = sqliteTable("testimonials", {
  id: id(),
  author: text("author").notNull(),
  rating: integer("rating").default(5).notNull(),
  quote: text("quote").notNull(),
  source: text("source").default("Google").notNull(),
  reviewedAt: text("reviewed_at"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  ...timestamps,
});

export const socialLinks = sqliteTable("social_links", {
  id: id(),
  platform: text("platform").notNull(),
  url: text("url").notNull(),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  ...timestamps,
});

// Relations ------------------------------------------------------------------

export const customersRelations = relations(customers, ({ many }) => ({
  packages: many(customerPackages),
  attendees: many(sessionAttendees),
  invoices: many(invoices),
}));

export const coachesRelations = relations(coaches, ({ many }) => ({
  sessions: many(sessions),
  expenses: many(expenses),
}));

export const customerPackagesRelations = relations(
  customerPackages,
  ({ one, many }) => ({
    customer: one(customers, {
      fields: [customerPackages.customerId],
      references: [customers.id],
    }),
    invoices: many(invoices),
    attendees: many(sessionAttendees),
  }),
);

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  coach: one(coaches, {
    fields: [sessions.coachId],
    references: [coaches.id],
  }),
  attendees: many(sessionAttendees),
}));

export const sessionAttendeesRelations = relations(
  sessionAttendees,
  ({ one }) => ({
    session: one(sessions, {
      fields: [sessionAttendees.sessionId],
      references: [sessions.id],
    }),
    customer: one(customers, {
      fields: [sessionAttendees.customerId],
      references: [customers.id],
    }),
    package: one(customerPackages, {
      fields: [sessionAttendees.packageId],
      references: [customerPackages.id],
    }),
  }),
);

export const invoicesRelations = relations(invoices, ({ one }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  package: one(customerPackages, {
    fields: [invoices.packageId],
    references: [customerPackages.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  coach: one(coaches, {
    fields: [expenses.coachId],
    references: [coaches.id],
  }),
}));

export type Customer = typeof customers.$inferSelect;
export type Coach = typeof coaches.$inferSelect;
export type CustomerPackage = typeof customerPackages.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type SessionAttendee = typeof sessionAttendees.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type PackageType = (typeof PACKAGE_TYPES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type SessionType = (typeof SESSION_TYPES)[number];
export type AttendeeStatus = (typeof ATTENDEE_STATUSES)[number];
