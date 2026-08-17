// Fallback content for when TURSO_CONNECTION_URL is not set, so the public
// site still renders without a database. Images are Unsplash placeholders —
// replace them through the CMS once real gym photography exists.

const UNSPLASH = "https://images.unsplash.com/photo";

// Keyless Google Maps embed for the Google Business Profile address.
export const GOOGLE_MAP_EMBED =
  "https://www.google.com/maps?q=HERCULES+FACTORY,+Jalan+Cerdas,+Taman+Connaught,+56000+Kuala+Lumpur&output=embed";

// Shared with scripts/seed.ts so the demo fallback and a seeded database show
// the same content. `zh` holds the Chinese overrides for the `/zh` route,
// keyed by the English field it replaces.
export const WHY_ITEMS = [
  {
    emoji: "🥊",
    title: "Beginner Friendly",
    description:
      "Never thrown a punch? Perfect. Every class starts with the basics and nobody gets thrown in the deep end.",
    zh: {
      title: "新手友好",
      description:
        "从来没打过拳？正好。每堂课都从基本功开始，不会有人被丢进深水区。",
    },
  },
  {
    emoji: "🔥",
    title: "Weight Loss & Fitness",
    description:
      "An hour of pads, bag work, and conditioning burns more than a treadmill ever will — and it does not feel like cardio.",
    zh: {
      title: "减脂与体能",
      description:
        "一小时的打靶、沙包和体能训练，比跑步机烧得更多——而且完全不像在做有氧。",
    },
  },
  {
    emoji: "👊",
    title: "Authentic Muay Thai",
    description:
      "Real technique, taught the Thai way: elbows, knees, clinch, and the footwork that ties it together.",
    zh: {
      title: "正宗泰式技法",
      description:
        "泰国教法，真材实料：肘、膝、内围缠斗，以及串起这一切的步法。",
    },
  },
  {
    emoji: "❤️",
    title: "Female Friendly",
    description:
      "A large part of our class is women. Train hard in a room where nobody is trying to prove anything.",
    zh: {
      title: "女生也自在",
      description:
        "我们的学员有很大一部分是女生。在这里可以专心训练，没有人需要证明什么。",
    },
  },
  {
    emoji: "🏆",
    title: "Structured Coaching",
    description:
      "Coaches track where you are and what comes next, so every session builds on the last one.",
    zh: {
      title: "有系统的教学",
      description:
        "教练会记录你的进度和下一步该练什么，每一堂课都接着上一堂往前走。",
    },
  },
  {
    emoji: "🤝",
    title: "Community, Not a Chain",
    description:
      "A small gym where the coaches know your name and members stay for the people as much as the training.",
    zh: {
      title: "是社群，不是连锁店",
      description:
        "小而实在的拳馆，教练记得住你的名字；大家留下来，是为了训练，也是为了这群人。",
    },
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
    zh: {
      name: "团体课",
      description: "适合想练体能、想减重，或完全从零开始的你。",
      whatsappMessage: "你好！我想报名 Hercules Factory 的团体课。😊",
    },
  },
  {
    name: "KIDS CLASS",
    description: "Ages 5 to 10. Discipline, coordination, and a lot of fun.",
    imageId: "1526506118085-60ce8714f8c5",
    whatsappMessage:
      "Hi! I'd like to ask about the Kids Class at Hercules Factory. 😊",
    zh: {
      name: "儿童课",
      description: "5 至 10 岁。培养纪律、协调性，而且很好玩。",
      whatsappMessage: "你好！我想了解 Hercules Factory 的儿童课。😊",
    },
  },
  {
    name: "PERSONAL TRAINING",
    description: "One to one coaching for adults and kids, at your own pace.",
    imageId: "1594381898411-846e7d193883",
    whatsappMessage:
      "Hi! I'd like to ask about Personal Training at Hercules Factory. 😊",
    zh: {
      name: "私人教练",
      description: "成人与儿童一对一指导，按自己的节奏练。",
      whatsappMessage: "你好！我想了解 Hercules Factory 的私人教练课。😊",
    },
  },
];

// The rate card. `highlight` lifts the row out of the ledger and into the accent
// band below it — exactly one row should carry it.
export const PRICING_ITEMS: {
  name: string;
  priceCents: number;
  unit: string | null;
  features: string;
  highlight: boolean;
  whatsappMessage: string;
  zh: Record<string, string>;
}[] = [
  {
    name: "UNLIMITED PASS",
    priceCents: 22_000,
    unit: "month",
    features: "No registration fee\nUnlimited group classes",
    highlight: false,
    whatsappMessage:
      "Hi! I'd like to sign up for the Unlimited Pass at Hercules Factory. 😊",
    zh: {
      name: "无限次月票",
      unit: "月",
      features: "免注册费\n团体课无限次",
      whatsappMessage: "你好！我想报名 Hercules Factory 的无限次月票。😊",
    },
  },
  {
    name: "10 CREDITS",
    priceCents: 15_000,
    unit: null,
    features: "10 group class credits\nValid for 4 weeks",
    highlight: false,
    whatsappMessage:
      "Hi! I'd like to buy the 10-credit package at Hercules Factory. 😊",
    zh: {
      name: "10 堂课配套",
      features: "10 堂团体课\n有效期 4 星期",
      whatsappMessage: "你好！我想购买 Hercules Factory 的 10 堂课配套。😊",
    },
  },
  {
    name: "DROP-IN CLASS",
    priceCents: 4_000,
    unit: "class",
    features: "Perfect for those who prefer flexible training",
    highlight: false,
    whatsappMessage:
      "Hi! I'd like to join a drop-in class at Hercules Factory. 😊",
    zh: {
      name: "单堂课",
      unit: "堂",
      features: "适合想弹性安排训练时间的你",
      whatsappMessage: "你好！我想参加 Hercules Factory 的单堂课。😊",
    },
  },
  {
    name: "TRIAL CLASS",
    priceCents: 2_000,
    unit: "person",
    features: "Perfect for beginners\nNo experience required",
    highlight: true,
    whatsappMessage:
      "Hi! I'd like to book the RM20 trial class at Hercules Factory. 😊",
    zh: {
      name: "体验课",
      unit: "位",
      features: "最适合新手\n零经验也可以",
      whatsappMessage: "你好！我想预约 Hercules Factory RM20 的体验课。😊",
    },
  },
];

export const FAQ_ITEMS = [
  {
    question: "I've never trained Muay Thai before. Can I join?",
    answer: "Yes! Our classes are beginner-friendly.",
    zh: {
      question: "我完全没练过泰拳，可以参加吗？",
      answer: "当然可以！我们的课程本来就是为新手设计的。",
    },
  },
  {
    question: "Do I need my own gloves?",
    answer: "No. Gloves are available for use during your trial/class.",
    zh: {
      question: "需要自备拳套吗？",
      answer: "不需要。体验课和一般课程都可以借用拳套。",
    },
  },
  {
    question: "Can women join?",
    answer: "Absolutely. We welcome beginners of all fitness levels.",
    zh: {
      question: "女生可以参加吗？",
      answer: "当然。不论体能程度如何，我们都欢迎新手。",
    },
  },
  {
    question: "How do I book a trial class?",
    answer: "Simply WhatsApp us and we'll help you choose a suitable class.",
    zh: {
      question: "怎么预约体验课？",
      answer: "直接 WhatsApp 我们，我们会帮你挑一堂合适的课。",
    },
  },
  {
    question: "What are your training hours?",
    answer:
      "Mon, Tue, Thu, Fri 7–10pm · Sun 1–2pm · Closed Wed and Sat. WhatsApp us to confirm before you come down.",
    zh: {
      question: "训练时间是什么时候？",
      answer:
        "一、二、四、五 晚上 7–10 点 · 周日 1–2 点 · 周三与周六休息。出发前请先 WhatsApp 我们确认。",
    },
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
    pricingTitle: "Pricing",
    promotionsTitle: "Promotions",
    testimonialsTitle: "What members say",
    faqTitle: "FAQ",
    locationTitle: "Find us",
    locationAddress:
      "Jalan Cerdas, Taman Connaught, 56000 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur",
    mapEmbedUrl: GOOGLE_MAP_EMBED as string | null,
    zh: {
      heroHeadline: "人人都能练泰拳",
      heroSubtitle: "新手。健身。拳手。",
      primaryCtaText: "立即报名",
      whatsappMessage: "你好！我想报名 Hercules Factory 的泰拳课程。😊",
      whyTitle: "为什么选 Hercules Factory",
      classesTitle: "课程",
      galleryTitle: "相册",
      pricingTitle: "价格",
      promotionsTitle: "优惠",
      testimonialsTitle: "学员怎么说",
      faqTitle: "常见问题",
      locationTitle: "怎么找到我们",
      locationAddress:
        "Jalan Cerdas, Taman Connaught, 56000 吉隆坡, 马来西亚联邦直辖区",
    } as Record<string, string> | null,
  },
  why: WHY_ITEMS.map((item, index) => ({
    id: `w${index + 1}`,
    iconUrl: null as string | null,
    ...item,
  })),
  classes: CLASS_ITEMS.map(({ imageId, ...item }, index) => ({
    id: `c${index + 1}`,
    ...item,
    imageUrl: `${UNSPLASH}-${imageId}?auto=format&fit=crop&w=1200&q=70`,
  })),
  pricing: PRICING_ITEMS.map((item, index) => ({
    id: `pp${index + 1}`,
    ...item,
  })),
  faq: FAQ_ITEMS.map((item, index) => ({ id: `f${index + 1}`, ...item })),
  gallery: GALLERY_ITEMS.map((item, index) => ({
    id: `g${index + 1}`,
    submittedBy: null as string | null,
    ...item,
  })),
  promo: {
    id: "p1",
    title: "Trial class RM30",
    imageUrl: `${UNSPLASH}-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=900&h=1600&q=70`,
    whatsappMessage: "Hi! I'd like to claim the RM30 trial class." as
      | string
      | null,
  },
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
