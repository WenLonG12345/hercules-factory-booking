"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import {
  bookings,
  classSessions,
  coaches,
  customers,
  galleryImages,
  invoices,
  landingPageContent,
  memberships,
  packages,
  socialLinks,
  testimonials,
} from "@/db/schema";
import { addDays, toDateInputValue } from "@/lib/utils";
import {
  createBookingWithCapacityCheck,
  createInvoice,
  createMembershipForPackage,
  createOrFindCustomer,
  markAttendance,
  recordPayment,
} from "@/server/services/business";
import { customerInput } from "@/server/validators/customer";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return item ? String(item) : undefined;
}

export async function createCustomerAction(formData: FormData) {
  const parsed = customerInput.parse({
    name: value(formData, "name"),
    phone: value(formData, "phone"),
    email: value(formData, "email") ?? "",
    emergencyContact: value(formData, "emergencyContact"),
    notes: value(formData, "notes"),
  });

  const [customer] = await getDb().insert(customers).values(parsed).returning();
  revalidatePath("/admin/customers");
  redirect(`/admin/customers/${customer.id}`);
}

export async function deleteCustomerAction(formData: FormData) {
  const id = String(formData.get("id"));
  await getDb().delete(customers).where(eq(customers.id, id));
  revalidatePath("/admin/customers");
}

export async function createMembershipAction(formData: FormData) {
  await createMembershipForPackage(getDb(), {
    customerId: String(formData.get("customerId")),
    packageId: String(formData.get("packageId")),
    startDate: String(formData.get("startDate")),
  });
  revalidatePath(`/admin/customers/${formData.get("customerId")}`);
  revalidatePath("/admin/invoices");
}

export async function createClassSessionAction(formData: FormData) {
  const sessionDate = String(formData.get("sessionDate"));
  const date = new Date(`${sessionDate}T00:00:00`);
  const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();

  await getDb()
    .insert(classSessions)
    .values({
      title: String(formData.get("title") || "Muay Thai Class"),
      sessionDate,
      dayOfWeek,
      startTime: String(formData.get("startTime")),
      endTime: String(formData.get("endTime")),
      capacity: Number(formData.get("capacity") || 24),
      coachName: value(formData, "coachName"),
    });
  revalidatePath("/admin/schedule");
}

export async function cancelClassSessionAction(formData: FormData) {
  await getDb()
    .update(classSessions)
    .set({
      isCancelled: true,
      cancellationReason: value(formData, "reason"),
      updatedAt: new Date(),
    })
    .where(eq(classSessions.id, String(formData.get("id"))));
  revalidatePath("/admin/schedule");
}

export async function updateClassSessionAction(formData: FormData) {
  await getDb()
    .update(classSessions)
    .set({
      title: String(formData.get("title") || "Muay Thai Class"),
      startTime: String(formData.get("startTime")),
      endTime: String(formData.get("endTime")),
      capacity: Number(formData.get("capacity") || 24),
      updatedAt: new Date(),
    })
    .where(eq(classSessions.id, String(formData.get("id"))));
  revalidatePath("/admin/schedule");
}

export async function deleteClassSessionAction(formData: FormData) {
  await getDb()
    .delete(classSessions)
    .where(eq(classSessions.id, String(formData.get("id"))));
  revalidatePath("/admin/schedule");
}

export async function createBookingAction(formData: FormData) {
  await createBookingWithCapacityCheck(getDb(), {
    customerId: String(formData.get("customerId")),
    classSessionId: String(formData.get("classSessionId")),
    source: "admin",
    notes: value(formData, "notes"),
  });
  revalidatePath("/admin/bookings");
}

export async function publicBookingAction(formData: FormData) {
  const customer = await createOrFindCustomer(getDb(), {
    name: String(formData.get("name")),
    phone: String(formData.get("phone")),
    email: value(formData, "email"),
    notes: value(formData, "notes"),
  });
  await createBookingWithCapacityCheck(getDb(), {
    customerId: customer.id,
    classSessionId: String(formData.get("classSessionId")),
    source: "public",
    notes: value(formData, "notes"),
  });
  redirect("/book?success=1");
}

export async function updateBookingStatusAction(formData: FormData) {
  await getDb()
    .update(bookings)
    .set({
      status: String(formData.get("status")) as "booked",
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, String(formData.get("id"))));
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/attendance");
}

export async function markAttendanceAction(formData: FormData) {
  await markAttendance(getDb(), {
    bookingId: String(formData.get("bookingId")),
    signatureDataUrl: value(formData, "signatureDataUrl"),
  });
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/bookings");
}

export async function createInvoiceAction(formData: FormData) {
  await createInvoice(getDb(), {
    customerId: String(formData.get("customerId")),
    membershipId: value(formData, "membershipId") ?? null,
    subtotalCents: Number(formData.get("subtotalCents") || 0),
    totalCents: Number(formData.get("totalCents") || 0),
    dueDate: value(formData, "dueDate"),
    notes: value(formData, "notes"),
  });
  revalidatePath("/admin/invoices");
}

export async function recordPaymentAction(formData: FormData) {
  await recordPayment(getDb(), {
    invoiceId: String(formData.get("invoiceId")),
    customerId: String(formData.get("customerId")),
    amountCents: Number(formData.get("amountCents") || 0),
    method: String(formData.get("method")) as "cash",
    paidDate: String(formData.get("paidDate")),
    reference: value(formData, "reference"),
  });
  revalidatePath("/admin/invoices");
  revalidatePath("/admin/reports");
}

export async function updateLandingContentAction(formData: FormData) {
  const db = getDb();
  const input = {
    heroTitle: String(formData.get("heroTitle")),
    heroSubtitle: String(formData.get("heroSubtitle")),
    primaryCtaText: String(formData.get("primaryCtaText")),
    secondaryCtaText: String(formData.get("secondaryCtaText")),
    aboutTitle: String(formData.get("aboutTitle")),
    aboutBody: String(formData.get("aboutBody")),
    locationTitle: String(formData.get("locationTitle")),
    locationAddress: String(formData.get("locationAddress")),
    mapEmbedUrl: value(formData, "mapEmbedUrl"),
  };
  const existing = await db.query.landingPageContent.findFirst();
  if (existing) {
    await db
      .update(landingPageContent)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(landingPageContent.id, existing.id));
  } else {
    await db.insert(landingPageContent).values(input);
  }
  revalidatePath("/");
  revalidatePath("/admin/cms");
}

export async function deleteGalleryImageAction(formData: FormData) {
  await getDb()
    .delete(galleryImages)
    .where(eq(galleryImages.id, String(formData.get("id"))));
  revalidatePath("/admin/cms");
  revalidatePath("/");
}

export async function deleteCoachAction(formData: FormData) {
  await getDb()
    .delete(coaches)
    .where(eq(coaches.id, String(formData.get("id"))));
  revalidatePath("/admin/cms");
  revalidatePath("/");
}

export async function deleteTestimonialAction(formData: FormData) {
  await getDb()
    .delete(testimonials)
    .where(eq(testimonials.id, String(formData.get("id"))));
  revalidatePath("/admin/cms");
  revalidatePath("/");
}

export async function deleteSocialLinkAction(formData: FormData) {
  await getDb()
    .delete(socialLinks)
    .where(eq(socialLinks.id, String(formData.get("id"))));
  revalidatePath("/admin/cms");
  revalidatePath("/");
}

export async function createGalleryImageAction(formData: FormData) {
  await getDb()
    .insert(galleryImages)
    .values({
      imageUrl: String(formData.get("imageUrl")),
      alt: String(formData.get("alt")),
      caption: value(formData, "caption"),
      sortOrder: Number(formData.get("sortOrder") || 0),
    });
  revalidatePath("/admin/cms");
  revalidatePath("/");
}

export async function uploadGalleryImageAction(formData: FormData) {
  const { createSupabaseServerClient } = await import("@/lib/supabase");
  const file = formData.get("imageFile") as File | null;
  if (!file || file.size === 0) throw new Error("No file provided");

  const supabase = createSupabaseServerClient();
  await supabase.storage
    .createBucket("gallery", { public: true })
    .catch(() => {});

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from("gallery")
    .upload(filename, bytes, { contentType: file.type });
  if (error) {
    const hint =
      error.message.includes("row-level security") ||
      error.message.includes("policy")
        ? " — add SUPABASE_SERVICE_ROLE_KEY to .env.local"
        : "";
    throw new Error(error.message + hint);
  }

  const { data } = supabase.storage.from("gallery").getPublicUrl(filename);

  await getDb()
    .insert(galleryImages)
    .values({
      imageUrl: data.publicUrl,
      alt: String(formData.get("alt") || ""),
      caption: value(formData, "caption"),
      sortOrder: Number(formData.get("sortOrder") || 0),
    });
  revalidatePath("/admin/cms");
  revalidatePath("/");
}

export async function createCoachAction(formData: FormData) {
  await getDb()
    .insert(coaches)
    .values({
      name: String(formData.get("name")),
      title: String(formData.get("title")),
      bio: String(formData.get("bio")),
      imageUrl: value(formData, "imageUrl"),
      sortOrder: Number(formData.get("sortOrder") || 0),
    });
  revalidatePath("/admin/cms");
}

export async function createTestimonialAction(formData: FormData) {
  await getDb()
    .insert(testimonials)
    .values({
      customerName: String(formData.get("customerName")),
      quote: String(formData.get("quote")),
      rating: Number(formData.get("rating") || 5),
      sortOrder: Number(formData.get("sortOrder") || 0),
    });
  revalidatePath("/admin/cms");
}

export async function createSocialLinkAction(formData: FormData) {
  await getDb()
    .insert(socialLinks)
    .values({
      platform: String(formData.get("platform")),
      label: String(formData.get("label")),
      url: String(formData.get("url")),
      sortOrder: Number(formData.get("sortOrder") || 0),
    });
  revalidatePath("/admin/cms");
}

const WEEKLY_SLOTS: Record<number, { startTime: string; endTime: string }[]> = {
  1: [
    { startTime: "19:00", endTime: "20:30" },
    { startTime: "20:30", endTime: "22:00" },
  ],
  2: [
    { startTime: "19:00", endTime: "20:30" },
    { startTime: "20:30", endTime: "22:00" },
  ],
  3: [
    { startTime: "19:00", endTime: "20:30" },
    { startTime: "20:30", endTime: "22:00" },
  ],
  4: [
    { startTime: "19:00", endTime: "20:30" },
    { startTime: "20:30", endTime: "22:00" },
  ],
  5: [
    { startTime: "19:00", endTime: "20:00" },
    { startTime: "20:00", endTime: "21:00" },
    { startTime: "21:00", endTime: "22:00" },
  ],
  6: [{ startTime: "21:00", endTime: "22:30" }],
};

export async function generateWeeklyScheduleAction(formData: FormData) {
  const startDate = String(formData.get("startDate"));
  const endDate = String(formData.get("endDate"));

  const current = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  const rows: {
    title: string;
    sessionDate: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    capacity: number;
  }[] = [];

  while (current <= end) {
    const jsDay = current.getDay();
    const isoDay = jsDay === 0 ? 7 : jsDay;
    const slots = WEEKLY_SLOTS[isoDay];

    if (slots) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
      for (const slot of slots) {
        rows.push({
          title: "Muay Thai Class",
          sessionDate: dateStr,
          dayOfWeek: isoDay,
          startTime: slot.startTime,
          endTime: slot.endTime,
          capacity: 24,
        });
      }
    }

    current.setDate(current.getDate() + 1);
  }

  if (rows.length > 0) {
    await getDb().insert(classSessions).values(rows).onConflictDoNothing();
  }

  revalidatePath("/admin/schedule");
}

export async function createPackageAction(formData: FormData) {
  const type = String(formData.get("type")) as
    | "single"
    | "ten_class"
    | "unlimited";
  const priceCents = Math.round(
    Number(formData.get("priceRinggit") || 0) * 100,
  );
  const classCreditsRaw = formData.get("classCredits");
  const validityDaysRaw = formData.get("validityDays");

  await getDb()
    .insert(packages)
    .values({
      name: String(formData.get("name")),
      type,
      priceCents,
      classCredits: classCreditsRaw ? Number(classCreditsRaw) : null,
      validityDays: validityDaysRaw ? Number(validityDaysRaw) : null,
      sortOrder: Number(formData.get("sortOrder") || 99),
    });
  revalidatePath("/admin/memberships");
}

export async function updatePackageAction(formData: FormData) {
  const id = String(formData.get("id"));
  const priceCents = Math.round(
    Number(formData.get("priceRinggit") || 0) * 100,
  );
  const classCreditsRaw = formData.get("classCredits");
  const validityDaysRaw = formData.get("validityDays");

  await getDb()
    .update(packages)
    .set({
      name: String(formData.get("name")),
      priceCents,
      classCredits: classCreditsRaw ? Number(classCreditsRaw) : null,
      validityDays: validityDaysRaw ? Number(validityDaysRaw) : null,
      isActive: formData.get("isActive") === "true",
      updatedAt: new Date(),
    })
    .where(eq(packages.id, id));
  revalidatePath("/admin/memberships");
}

export async function approvePortalMembershipAction(formData: FormData) {
  const db = getDb();
  const invoiceId = String(formData.get("invoiceId"));
  const packageId = String(formData.get("packageId"));
  const method = String(formData.get("method")) as
    | "cash"
    | "bank_transfer"
    | "tng"
    | "card"
    | "other";
  const paidDate = String(formData.get("paidDate"));
  const reference = value(formData, "reference");

  const [invoice] = await db
    .select({
      id: invoices.id,
      customerId: invoices.customerId,
      totalCents: invoices.totalCents,
      status: invoices.status,
    })
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  if (!invoice || invoice.status !== "pending")
    throw new Error("Invoice not found or already processed.");

  const [pkg] = await db
    .select()
    .from(packages)
    .where(eq(packages.id, packageId))
    .limit(1);
  if (!pkg) throw new Error("Package not found.");

  const startDate = paidDate;
  const expiryDate = pkg.validityDays
    ? toDateInputValue(addDays(new Date(startDate), pkg.validityDays))
    : null;

  const [membership] = await db
    .insert(memberships)
    .values({
      customerId: invoice.customerId,
      packageId,
      startDate,
      expiryDate,
      remainingCredits:
        pkg.type === "ten_class" ? (pkg.classCredits ?? 10) : null,
    })
    .returning();

  await db
    .update(invoices)
    .set({ membershipId: membership.id, updatedAt: new Date() })
    .where(eq(invoices.id, invoiceId));

  await recordPayment(db, {
    invoiceId,
    customerId: invoice.customerId,
    amountCents: invoice.totalCents,
    method,
    paidDate,
    reference,
  });

  revalidatePath("/admin/invoices");
}
