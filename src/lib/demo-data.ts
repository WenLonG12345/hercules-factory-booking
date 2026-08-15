// Fallback content for when TURSO_CONNECTION_URL is not set, so the public
// site still renders without a database. Images are Unsplash placeholders —
// replace them through the CMS once real gym photography exists.

const UNSPLASH = "https://images.unsplash.com/photo";

// Keyless Google Maps embed for the Google Business Profile address.
export const GOOGLE_MAP_EMBED =
  "https://www.google.com/maps?q=HERCULES+FACTORY,+Jalan+Cerdas,+Taman+Connaught,+56000+Kuala+Lumpur&output=embed";

// Shared with scripts/seed.ts so the demo fallback and a seeded database show
// the same content. English only — the landing page has one language.
export const WHY_ITEMS = [
  {
    emoji: "🥊",
    title: "Beginner Friendly",
    description:
      "Never thrown a punch? Perfect. Every class starts with the basics and nobody gets thrown in the deep end.",
  },
  {
    emoji: "🔥",
    title: "Weight Loss & Fitness",
    description:
      "An hour of pads, bag work, and conditioning burns more than a treadmill ever will — and it does not feel like cardio.",
  },
  {
    emoji: "👊",
    title: "Authentic Muay Thai",
    description:
      "Real technique, taught the Thai way: elbows, knees, clinch, and the footwork that ties it together.",
  },
  {
    emoji: "❤️",
    title: "Female Friendly",
    description:
      "A large part of our class is women. Train hard in a room where nobody is trying to prove anything.",
  },
  {
    emoji: "🏆",
    title: "Structured Coaching",
    description:
      "Coaches track where you are and what comes next, so every session builds on the last one.",
  },
  {
    emoji: "🤝",
    title: "Community, Not a Chain",
    description:
      "A small gym where the coaches know your name and members stay for the people as much as the training.",
  },
];

export const CLASS_ITEMS = [
  {
    name: "GROUP CLASS",
    description:
      "For anyone who wants to get fit, lose weight, or start from zero.",
    imageId: "1517438476312-10d79c077509",
    whatsappMessage:
      "Hi! I'd like to join the Group Class at Hercules Factory. 😊",
  },
  {
    name: "KIDS CLASS",
    description: "Ages 5 to 10. Discipline, coordination, and a lot of fun.",
    imageId: "1526506118085-60ce8714f8c5",
    whatsappMessage:
      "Hi! I'd like to ask about the Kids Class at Hercules Factory. 😊",
  },
  {
    name: "PERSONAL TRAINING",
    description: "One to one coaching for adults and kids, at your own pace.",
    imageId: "1594381898411-846e7d193883",
    whatsappMessage:
      "Hi! I'd like to ask about Personal Training at Hercules Factory. 😊",
  },
];

export const GALLERY_ITEMS = [
  ["1591117207239-788bf8de6c3b", "Group class training", "Group Class"],
  ["1544033527-b192daee1f5b", "Female friendly training", "Ladies Training"],
  ["1571019613454-1cb2f99b2d8b", "Kids class drills", "Kids Class"],
  [
    "1517836357463-d25dfeac3438",
    "Personal training session",
    "Personal Training",
  ],
  ["1544367567-0f2fcb009e0b", "Sparring round", "Sparring"],
  ["1552674605-db6ffd4facb5", "Coach working the pads", "Pad Work"],
  ["1583473848882-f9a5bc7fd2ee", "Clinch practice", "Clinch"],
  ["1517649763962-0c623066013b", "Bag work conditioning", "Conditioning"],
  ["1546483875-ad9014c88eba", "Gym floor and ring", "The Gym"],
].map(([imageId, alt, category]) => ({
  imageUrl: `${UNSPLASH}-${imageId}?auto=format&fit=crop&w=1200&q=70`,
  alt,
  category,
}));

export const demoLanding = {
  content: {
    id: "demo",
    heroKicker: "HERCULES FACTORY",
    heroHeadline: "MUAY THAI FOR EVERYONE",
    heroSubtitle: "Beginners. Fitness. Fighters.",
    heroImageUrl: `${UNSPLASH}-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=2000&q=70`,
    primaryCtaText: "BOOK A CLASS",
    whatsappPhone: "60162723083",
    whatsappMessage:
      "Hi! I'd like to book a Muay Thai class at Hercules Factory. 😊",
    whyTitle: "Why Hercules Factory",
    classesTitle: "Classes",
    galleryTitle: "Gallery",
    testimonialsTitle: "What members say",
    faqTitle: "FAQ",
    locationTitle: "Find us",
    locationAddress:
      "Jalan Cerdas, Taman Connaught, 56000 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur",
    mapEmbedUrl: GOOGLE_MAP_EMBED as string | null,
  },
  why: WHY_ITEMS.map((item, index) => ({ id: `w${index + 1}`, ...item })),
  classes: CLASS_ITEMS.map(({ imageId, ...item }, index) => ({
    id: `c${index + 1}`,
    ...item,
    imageUrl: `${UNSPLASH}-${imageId}?auto=format&fit=crop&w=1200&q=70`,
  })),
  faq: [
    {
      id: "f1",
      question: "I've never trained Muay Thai before. Can I join?",
      answer: "Yes! Our classes are beginner-friendly.",
    },
    {
      id: "f2",
      question: "Do I need my own gloves?",
      answer: "No. Gloves are available for use during your trial/class.",
    },
    {
      id: "f3",
      question: "Can women join?",
      answer: "Absolutely. We welcome beginners of all fitness levels.",
    },
    {
      id: "f4",
      question: "How do I book a trial class?",
      answer: "Simply WhatsApp us and we'll help you choose a suitable class.",
    },
    {
      id: "f5",
      question: "What are your training hours?",
      answer:
        "Mon, Tue, Thu, Fri 7–10pm · Sun 1–2pm · Closed Wed and Sat. WhatsApp us to confirm before you come down.",
    },
  ],
  gallery: GALLERY_ITEMS.map((item, index) => ({
    id: `g${index + 1}`,
    submittedBy: null as string | null,
    ...item,
  })),
  // Google Business Profile reviews (5.0★ from 9 reviews at time of import).
  reviews: [
    {
      id: "t1",
      author: "Inot Tamales",
      rating: 5,
      quote:
        "Been there few times, super beginner friendly. Clean and functional environment and very insightful coach.",
      source: "Google",
      reviewedAt: "Jun 2026",
    },
    {
      id: "t2",
      author: "Maxwell Kee Ming Jie",
      rating: 5,
      quote: "very friendly environment",
      source: "Google",
      reviewedAt: "Sep 2025",
    },
    {
      id: "t3",
      author: "leeping tan",
      rating: 5,
      quote:
        "Will go again definitely, place is spacious and location is easy to find.",
      source: "Google",
      reviewedAt: "Aug 2025",
    },
    {
      id: "t4",
      author: "Teo Wen Long",
      rating: 5,
      quote: "Nice coach and friendly environment",
      source: "Google",
      reviewedAt: "Aug 2025",
    },
    {
      id: "t5",
      author: "Bill Lim",
      rating: 5,
      quote: "Clean environment. Good class. Easy catch up skill.",
      source: "Google",
      reviewedAt: "Aug 2024",
    },
  ],
  social: [
    {
      id: "s1",
      platform: "instagram",
      label: "Instagram",
      url: "https://instagram.com/herculesfactory_",
    },
    {
      id: "s2",
      platform: "whatsapp",
      label: "WhatsApp",
      url: "https://wa.me/60162723083",
    },
  ],
};
