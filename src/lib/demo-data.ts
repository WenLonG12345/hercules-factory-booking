import { addDays, toDateInputValue } from "@/lib/utils";

const today = new Date();

export const demoPackages = [
  {
    id: "single",
    name: "Single Class",
    type: "single",
    priceCents: 2000,
    classCredits: null,
    validityDays: null,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "ten-class",
    name: "10-Class Package",
    type: "ten_class",
    priceCents: 15000,
    classCredits: 10,
    validityDays: 30,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "unlimited",
    name: "Unlimited Monthly",
    type: "unlimited",
    priceCents: 22000,
    classCredits: null,
    validityDays: 30,
    isActive: true,
    sortOrder: 3,
  },
] as const;

export const demoCustomers = [
  {
    id: "cust-1",
    name: "Aiman Rahman",
    phone: "0123456789",
    email: "aiman@example.com",
    notes: "Prefers second slot.",
    emergencyContact: "Siti 0129991111",
  },
  {
    id: "cust-2",
    name: "Mei Lin",
    phone: "0112223333",
    email: "mei@example.com",
    notes: "New beginner.",
    emergencyContact: "Tan 0118877665",
  },
  {
    id: "cust-3",
    name: "Daniel Chong",
    phone: "0164445555",
    email: "daniel@example.com",
    notes: "Unlimited member.",
    emergencyContact: "Grace 0161231234",
  },
];

export const demoMemberships = [
  {
    id: "mem-1",
    customerId: "cust-1",
    packageId: "ten-class",
    status: "active",
    startDate: toDateInputValue(addDays(today, -8)),
    expiryDate: toDateInputValue(addDays(today, 22)),
    remainingCredits: 7,
    package: demoPackages[1],
  },
  {
    id: "mem-2",
    customerId: "cust-3",
    packageId: "unlimited",
    status: "active",
    startDate: toDateInputValue(addDays(today, -4)),
    expiryDate: toDateInputValue(addDays(today, 26)),
    remainingCredits: null,
    package: demoPackages[2],
  },
];

export const demoSessions = Array.from({ length: 10 }, (_, index) => {
  const day = addDays(today, index);
  const dayOfWeek = day.getDay() === 0 ? 1 : day.getDay();
  const slot = index % 2 === 0;

  return {
    id: `session-${index + 1}`,
    title: "Muay Thai Class",
    sessionDate: toDateInputValue(day),
    dayOfWeek,
    startTime: slot ? "19:00" : "20:30",
    endTime: slot ? "20:30" : "22:00",
    capacity: 24,
    coachName: index % 3 === 0 ? "Coach Hafiz" : "Coach Marcus",
    isCancelled: false,
    cancellationReason: null,
  };
});

export const demoBookings = [
  {
    id: "booking-1",
    customerId: "cust-1",
    classSessionId: "session-1",
    status: "booked",
    source: "admin",
    customer: demoCustomers[0],
    classSession: demoSessions[0],
  },
  {
    id: "booking-2",
    customerId: "cust-2",
    classSessionId: "session-1",
    status: "booked",
    source: "public",
    customer: demoCustomers[1],
    classSession: demoSessions[0],
  },
  {
    id: "booking-3",
    customerId: "cust-3",
    classSessionId: "session-2",
    status: "attended",
    source: "admin",
    customer: demoCustomers[2],
    classSession: demoSessions[1],
  },
];

export const demoPayments = [
  {
    id: "pay-1",
    invoiceId: "inv-1",
    customerId: "cust-1",
    amountCents: 15000,
    method: "bank_transfer",
    paidDate: toDateInputValue(addDays(today, -5)),
    reference: "MBB-9210",
    customer: demoCustomers[0],
    invoice: { invoiceNumber: "HF-2026-00001" },
  },
  {
    id: "pay-2",
    invoiceId: "inv-2",
    customerId: "cust-3",
    amountCents: 22000,
    method: "tng",
    paidDate: toDateInputValue(addDays(today, -2)),
    reference: "TNG-4812",
    customer: demoCustomers[2],
    invoice: { invoiceNumber: "HF-2026-00002" },
  },
];

export const demoInvoices = [
  {
    id: "inv-1",
    invoiceNumber: "HF-2026-00001",
    customerId: "cust-1",
    status: "paid",
    issueDate: toDateInputValue(addDays(today, -5)),
    dueDate: toDateInputValue(addDays(today, 2)),
    subtotalCents: 15000,
    totalCents: 15000,
    notes: "10-class package",
    customer: demoCustomers[0],
    payments: [demoPayments[0]],
  },
  {
    id: "inv-2",
    invoiceNumber: "HF-2026-00002",
    customerId: "cust-3",
    status: "paid",
    issueDate: toDateInputValue(addDays(today, -2)),
    dueDate: toDateInputValue(addDays(today, 5)),
    subtotalCents: 22000,
    totalCents: 22000,
    notes: "Unlimited monthly",
    customer: demoCustomers[2],
    payments: [demoPayments[1]],
  },
  {
    id: "inv-3",
    invoiceNumber: "HF-2026-00003",
    customerId: "cust-2",
    status: "pending",
    issueDate: toDateInputValue(today),
    dueDate: toDateInputValue(addDays(today, 7)),
    subtotalCents: 2000,
    totalCents: 2000,
    notes: "Single class",
    customer: demoCustomers[1],
    payments: [],
  },
];

export const demoLanding = {
  content: {
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
    mapEmbedUrl: "",
  },
  gallery: [
    {
      id: "g1",
      imageUrl:
        "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80",
      alt: "Muay Thai training gloves",
      caption: "Pad rounds",
    },
    {
      id: "g2",
      imageUrl:
        "https://images.unsplash.com/photo-1517438322307-e67111335449?auto=format&fit=crop&w=1200&q=80",
      alt: "Boxing gym training area",
      caption: "Conditioning",
    },
    {
      id: "g3",
      imageUrl:
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
      alt: "Athlete wrapping hands",
      caption: "Fight prep",
    },
  ],
  coaches: [
    {
      id: "coach-1",
      name: "Coach Hafiz",
      title: "Head Coach",
      bio: "Technical pad holder focused on fundamentals, ring control, and smart pressure.",
      imageUrl:
        "https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "coach-2",
      name: "Coach Marcus",
      title: "Striking & Conditioning",
      bio: "Builds sharp combinations, strong engines, and confident beginners.",
      imageUrl:
        "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=900&q=80",
    },
  ],
  testimonials: [
    {
      id: "t1",
      customerName: "Nadia",
      quote:
        "The coaches make hard training approachable. I felt stronger after the first month.",
      rating: 5,
    },
    {
      id: "t2",
      customerName: "Jason",
      quote:
        "Clear structure, good energy, and no ego. Exactly what I wanted from a Muay Thai gym.",
      rating: 5,
    },
  ],
  socialLinks: [
    {
      id: "s1",
      platform: "facebook",
      label: "Facebook",
      url: "https://facebook.com",
    },
    {
      id: "s2",
      platform: "instagram",
      label: "Instagram",
      url: "https://instagram.com",
    },
    {
      id: "s3",
      platform: "whatsapp",
      label: "WhatsApp",
      url: "https://wa.me/60123456789",
    },
  ],
};
