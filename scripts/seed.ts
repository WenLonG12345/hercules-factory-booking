import { getDb } from "@/db";
import {
  attendanceRecords,
  bookings,
  classSessions,
  coaches,
  customers,
  galleryImages,
  invoices,
  landingPageContent,
  memberships,
  packages,
  payments,
  socialLinks,
  testimonials,
  users,
} from "@/db/schema";
import { addDays, toDateInputValue } from "@/lib/utils";

const db = getDb();
const today = new Date();

function sessionDate(daysFromToday: number) {
  return toDateInputValue(addDays(today, daysFromToday));
}

function dayOfWeek(date: string) {
  const day = new Date(`${date}T00:00:00`).getDay();
  return day === 0 ? 7 : day;
}

async function seed() {
  await db.delete(attendanceRecords);
  await db.delete(payments);
  await db.delete(invoices);
  await db.delete(bookings);
  await db.delete(classSessions);
  await db.delete(memberships);
  await db.delete(packages);
  await db.delete(customers);
  await db.delete(galleryImages);
  await db.delete(coaches);
  await db.delete(testimonials);
  await db.delete(socialLinks);
  await db.delete(landingPageContent);
  await db.delete(users);

  await db.insert(users).values({
    name: "Hercules Factory Admin",
    email: "admin@herculesfactory.local",
    passwordHash: "development-password",
  });

  const [singlePackage, tenClassPackage, unlimitedPackage] = await db
    .insert(packages)
    .values([
      {
        name: "Single Class",
        type: "single",
        priceCents: 2000,
        classCredits: null,
        validityDays: null,
        sortOrder: 1,
      },
      {
        name: "10-Class Package",
        type: "ten_class",
        priceCents: 15000,
        classCredits: 10,
        validityDays: 30,
        sortOrder: 2,
      },
      {
        name: "Unlimited Monthly",
        type: "unlimited",
        priceCents: 22000,
        classCredits: null,
        validityDays: 30,
        sortOrder: 3,
      },
    ])
    .returning();

  const [aiman, mei, daniel] = await db
    .insert(customers)
    .values([
      {
        name: "Aiman Rahman",
        phone: "0123456789",
        email: "aiman@example.com",
        emergencyContact: "Siti 0129991111",
        notes: "Prefers second slot.",
      },
      {
        name: "Mei Lin",
        phone: "0112223333",
        email: "mei@example.com",
        emergencyContact: "Tan 0118877665",
        notes: "Beginner trial.",
      },
      {
        name: "Daniel Chong",
        phone: "0164445555",
        email: "daniel@example.com",
        emergencyContact: "Grace 0161231234",
        notes: "Unlimited member.",
      },
      {
        name: "Farah Aziz",
        phone: "0198887777",
        email: "farah@example.com",
        emergencyContact: "Adam 0192221111",
        notes: "Interested in sparring after basics.",
      },
    ])
    .returning();

  const [aimanMembership, danielMembership] = await db
    .insert(memberships)
    .values([
      {
        customerId: aiman.id,
        packageId: tenClassPackage.id,
        startDate: sessionDate(-8),
        expiryDate: sessionDate(22),
        remainingCredits: 7,
      },
      {
        customerId: daniel.id,
        packageId: unlimitedPackage.id,
        startDate: sessionDate(-3),
        expiryDate: sessionDate(27),
        remainingCredits: null,
      },
      {
        customerId: mei.id,
        packageId: singlePackage.id,
        startDate: sessionDate(0),
        expiryDate: null,
        remainingCredits: null,
      },
    ])
    .returning();

  const sessions = await db
    .insert(classSessions)
    .values(
      Array.from({ length: 12 }, (_, index) => {
        const date = sessionDate(index);
        const firstSlot = index % 2 === 0;
        return {
          title: "Muay Thai Class",
          sessionDate: date,
          dayOfWeek: dayOfWeek(date),
          startTime: firstSlot ? "19:00" : "20:30",
          endTime: firstSlot ? "20:30" : "22:00",
          capacity: 24,
          coachName: index % 3 === 0 ? "Coach Hafiz" : "Coach Marcus",
        };
      }),
    )
    .returning();

  const [bookingOne, bookingTwo, bookingThree] = await db
    .insert(bookings)
    .values([
      {
        customerId: aiman.id,
        classSessionId: sessions[0].id,
        source: "admin",
        status: "booked",
      },
      {
        customerId: mei.id,
        classSessionId: sessions[0].id,
        source: "public",
        status: "booked",
      },
      {
        customerId: daniel.id,
        classSessionId: sessions[1].id,
        source: "admin",
        status: "attended",
      },
    ])
    .returning();

  await db.insert(attendanceRecords).values({
    bookingId: bookingThree.id,
    customerId: daniel.id,
    classSessionId: sessions[1].id,
    membershipId: danielMembership.id,
    creditDeducted: false,
  });

  const [invoiceOne, invoiceTwo, invoiceThree] = await db
    .insert(invoices)
    .values([
      {
        invoiceNumber: "HF-2026-00001",
        customerId: aiman.id,
        membershipId: aimanMembership.id,
        issueDate: sessionDate(-5),
        dueDate: sessionDate(2),
        subtotalCents: 15000,
        totalCents: 15000,
        status: "paid",
        notes: "10-class package",
      },
      {
        invoiceNumber: "HF-2026-00002",
        customerId: daniel.id,
        membershipId: danielMembership.id,
        issueDate: sessionDate(-3),
        dueDate: sessionDate(4),
        subtotalCents: 22000,
        totalCents: 22000,
        status: "paid",
        notes: "Unlimited monthly",
      },
      {
        invoiceNumber: "HF-2026-00003",
        customerId: mei.id,
        issueDate: sessionDate(0),
        dueDate: sessionDate(7),
        subtotalCents: 2000,
        totalCents: 2000,
        status: "pending",
        notes: "Single class trial",
      },
    ])
    .returning();

  await db.insert(payments).values([
    {
      invoiceId: invoiceOne.id,
      customerId: aiman.id,
      amountCents: 15000,
      method: "bank_transfer",
      paidDate: sessionDate(-5),
      reference: "MBB-9210",
    },
    {
      invoiceId: invoiceTwo.id,
      customerId: daniel.id,
      amountCents: 22000,
      method: "tng",
      paidDate: sessionDate(-3),
      reference: "TNG-4812",
    },
  ]);

  await db.insert(landingPageContent).values({
    heroTitle: "Hercules Factory Muay Thai",
    heroSubtitle:
      "Hard rounds, sharp coaching, and a welcoming fight-family environment in Malaysia.",
    primaryCtaText: "Book Your First Class",
    secondaryCtaText: "WhatsApp Us",
    aboutTitle: "Built for real progress",
    aboutBody:
      "We train beginners, returning fighters, and competitors through structured pad work, conditioning, clinch fundamentals, and controlled sparring.",
    locationTitle: "Train with us",
    locationAddress: "Hercules Factory, Kuala Lumpur, Malaysia",
  });

  await db.insert(galleryImages).values([
    {
      imageUrl:
        "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80",
      alt: "Muay Thai training gloves",
      caption: "Pad rounds",
      sortOrder: 1,
    },
    {
      imageUrl:
        "https://images.unsplash.com/photo-1517438322307-e67111335449?auto=format&fit=crop&w=1200&q=80",
      alt: "Boxing gym training area",
      caption: "Conditioning",
      sortOrder: 2,
    },
    {
      imageUrl:
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
      alt: "Athlete wrapping hands",
      caption: "Fight prep",
      sortOrder: 3,
    },
  ]);

  await db.insert(coaches).values([
    {
      name: "Coach Hafiz",
      title: "Head Coach",
      bio: "Technical pad holder focused on fundamentals, ring control, and smart pressure.",
      imageUrl:
        "https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?auto=format&fit=crop&w=900&q=80",
      sortOrder: 1,
    },
    {
      name: "Coach Marcus",
      title: "Striking & Conditioning",
      bio: "Builds sharp combinations, strong engines, and confident beginners.",
      imageUrl:
        "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=900&q=80",
      sortOrder: 2,
    },
  ]);

  await db.insert(testimonials).values([
    {
      customerName: "Nadia",
      quote:
        "The coaches make hard training approachable. I felt stronger after the first month.",
      rating: 5,
      sortOrder: 1,
    },
    {
      customerName: "Jason",
      quote:
        "Clear structure, good energy, and no ego. Exactly what I wanted from a Muay Thai gym.",
      rating: 5,
      sortOrder: 2,
    },
  ]);

  await db.insert(socialLinks).values([
    {
      platform: "facebook",
      label: "Facebook",
      url: "https://facebook.com",
      sortOrder: 1,
    },
    {
      platform: "instagram",
      label: "Instagram",
      url: "https://instagram.com",
      sortOrder: 2,
    },
    {
      platform: "whatsapp",
      label: "WhatsApp",
      url: "https://wa.me/60123456789",
      sortOrder: 3,
    },
  ]);

  console.log("Seeded Hercules Factory data.");
  console.log(`Sample pending booking: ${bookingOne.id}, ${bookingTwo.id}`);
  console.log(`Sample pending invoice: ${invoiceThree.invoiceNumber}`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
