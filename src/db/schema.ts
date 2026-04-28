import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const packageTypeEnum = pgEnum("package_type", [
  "single",
  "ten_class",
  "unlimited",
]);

export const membershipStatusEnum = pgEnum("membership_status", [
  "active",
  "expired",
  "cancelled",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "booked",
  "attended",
  "no_show",
  "cancelled",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "pending",
  "paid",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "bank_transfer",
  "tng",
  "card",
  "other",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").default("admin").notNull(),
  ...timestamps,
});

// better-auth tables
export const authUser = pgTable("auth_user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  role: text("role").default("customer").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const authSession = pgTable("auth_session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => authUser.id, { onDelete: "cascade" }),
});

export const authAccount = pgTable("auth_account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => authUser.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const authVerification = pgTable("auth_verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    notes: text("notes"),
    emergencyContact: text("emergency_contact"),
    authUserId: text("auth_user_id").references(() => authUser.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => ({
    phoneIdx: uniqueIndex("customers_phone_idx").on(table.phone),
    nameIdx: index("customers_name_idx").on(table.name),
    authUserIdx: uniqueIndex("customers_auth_user_id_idx").on(table.authUserId),
  }),
);

export const packages = pgTable("packages", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: packageTypeEnum("type").notNull(),
  priceCents: integer("price_cents").notNull(),
  classCredits: integer("class_credits"),
  validityDays: integer("validity_days"),
  durationMinutes: integer("duration_minutes"),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  ...timestamps,
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .references(() => customers.id, { onDelete: "cascade" })
      .notNull(),
    packageId: uuid("package_id")
      .references(() => packages.id)
      .notNull(),
    status: membershipStatusEnum("status").default("active").notNull(),
    startDate: date("start_date").notNull(),
    expiryDate: date("expiry_date"),
    remainingCredits: integer("remaining_credits"),
    ...timestamps,
  },
  (table) => ({
    customerIdx: index("memberships_customer_idx").on(table.customerId),
  }),
);

export const classSessions = pgTable(
  "class_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").default("Muay Thai Class").notNull(),
    sessionDate: date("session_date").notNull(),
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    capacity: integer("capacity").default(24).notNull(),
    coachName: text("coach_name"),
    isCancelled: boolean("is_cancelled").default(false).notNull(),
    cancellationReason: text("cancellation_reason"),
    ...timestamps,
  },
  (table) => ({
    dateIdx: index("class_sessions_date_idx").on(table.sessionDate),
    uniqueSlot: uniqueIndex("class_sessions_unique_slot_idx").on(
      table.sessionDate,
      table.startTime,
    ),
  }),
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .references(() => customers.id, { onDelete: "cascade" })
      .notNull(),
    classSessionId: uuid("class_session_id")
      .references(() => classSessions.id, { onDelete: "cascade" })
      .notNull(),
    status: bookingStatusEnum("status").default("booked").notNull(),
    source: text("source").default("admin").notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => ({
    customerSessionIdx: uniqueIndex("bookings_customer_session_idx").on(
      table.customerId,
      table.classSessionId,
    ),
    sessionIdx: index("bookings_session_idx").on(table.classSessionId),
  }),
);

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .references(() => bookings.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    customerId: uuid("customer_id")
      .references(() => customers.id, { onDelete: "cascade" })
      .notNull(),
    classSessionId: uuid("class_session_id")
      .references(() => classSessions.id, { onDelete: "cascade" })
      .notNull(),
    membershipId: uuid("membership_id").references(() => memberships.id),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    signatureDataUrl: text("signature_data_url"),
    creditDeducted: boolean("credit_deducted").default(false).notNull(),
    ...timestamps,
  },
  (table) => ({
    sessionIdx: index("attendance_session_idx").on(table.classSessionId),
  }),
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceNumber: text("invoice_number").notNull().unique(),
    customerId: uuid("customer_id")
      .references(() => customers.id, { onDelete: "cascade" })
      .notNull(),
    membershipId: uuid("membership_id").references(() => memberships.id),
    status: invoiceStatusEnum("status").default("pending").notNull(),
    issueDate: date("issue_date").default(sql`CURRENT_DATE`).notNull(),
    dueDate: date("due_date"),
    subtotalCents: integer("subtotal_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => ({
    customerIdx: index("invoices_customer_idx").on(table.customerId),
  }),
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: uuid("invoice_id")
      .references(() => invoices.id, { onDelete: "cascade" })
      .notNull(),
    customerId: uuid("customer_id")
      .references(() => customers.id, { onDelete: "cascade" })
      .notNull(),
    amountCents: integer("amount_cents").notNull(),
    method: paymentMethodEnum("method").notNull(),
    paidDate: date("paid_date").notNull(),
    reference: text("reference"),
    ...timestamps,
  },
  (table) => ({
    paidDateIdx: index("payments_paid_date_idx").on(table.paidDate),
  }),
);

export const landingPageContent = pgTable("landing_page_content", {
  id: uuid("id").defaultRandom().primaryKey(),
  heroTitle: text("hero_title").notNull(),
  heroSubtitle: text("hero_subtitle").notNull(),
  primaryCtaText: text("primary_cta_text")
    .default("Book Your First Class")
    .notNull(),
  secondaryCtaText: text("secondary_cta_text").default("WhatsApp Us").notNull(),
  aboutTitle: text("about_title").notNull(),
  aboutBody: text("about_body").notNull(),
  locationTitle: text("location_title").notNull(),
  locationAddress: text("location_address").notNull(),
  mapEmbedUrl: text("map_embed_url"),
  ...timestamps,
});

export const galleryImages = pgTable("gallery_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  imageUrl: text("image_url").notNull(),
  alt: text("alt").notNull(),
  caption: text("caption"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export const coaches = pgTable("coaches", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  bio: text("bio").notNull(),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export const testimonials = pgTable("testimonials", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerName: text("customer_name").notNull(),
  quote: text("quote").notNull(),
  rating: integer("rating").default(5).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export const socialLinks = pgTable("social_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  platform: text("platform").notNull(),
  url: text("url").notNull(),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export const authUserRelations = relations(authUser, ({ one }) => ({
  customer: one(customers, {
    fields: [authUser.id],
    references: [customers.authUserId],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  authUser: one(authUser, {
    fields: [customers.authUserId],
    references: [authUser.id],
  }),
  memberships: many(memberships),
  bookings: many(bookings),
  invoices: many(invoices),
  payments: many(payments),
}));

export const packagesRelations = relations(packages, ({ many }) => ({
  memberships: many(memberships),
}));

export const membershipsRelations = relations(memberships, ({ one, many }) => ({
  customer: one(customers, {
    fields: [memberships.customerId],
    references: [customers.id],
  }),
  package: one(packages, {
    fields: [memberships.packageId],
    references: [packages.id],
  }),
  attendanceRecords: many(attendanceRecords),
  invoices: many(invoices),
}));

export const classSessionsRelations = relations(classSessions, ({ many }) => ({
  bookings: many(bookings),
  attendanceRecords: many(attendanceRecords),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  customer: one(customers, {
    fields: [bookings.customerId],
    references: [customers.id],
  }),
  classSession: one(classSessions, {
    fields: [bookings.classSessionId],
    references: [classSessions.id],
  }),
  attendanceRecords: many(attendanceRecords),
}));

export const attendanceRecordsRelations = relations(
  attendanceRecords,
  ({ one }) => ({
    booking: one(bookings, {
      fields: [attendanceRecords.bookingId],
      references: [bookings.id],
    }),
    customer: one(customers, {
      fields: [attendanceRecords.customerId],
      references: [customers.id],
    }),
    classSession: one(classSessions, {
      fields: [attendanceRecords.classSessionId],
      references: [classSessions.id],
    }),
    membership: one(memberships, {
      fields: [attendanceRecords.membershipId],
      references: [memberships.id],
    }),
  }),
);

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  membership: one(memberships, {
    fields: [invoices.membershipId],
    references: [memberships.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
}));

export type Customer = typeof customers.$inferSelect;
export type Package = typeof packages.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type ClassSession = typeof classSessions.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Payment = typeof payments.$inferSelect;
