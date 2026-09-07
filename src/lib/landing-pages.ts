import type { Locale } from "@/i18n/routing";

/**
 * The standalone search-landing pages that sit alongside the homepage.
 *
 * Google ranks pages, not sites, and the homepage can only ever be one answer.
 * Each entry below is a page written for one real search — "muay thai cheras",
 * "muay thai kuala lumpur", "kids muay thai kl", "muay thai for beginners" —
 * with its own H1, prose and FAQ.
 *
 * ponytail: plain copy in a TS const, not new CMS tables. Rewriting these is a
 * once-a-year job and the admin has never asked to do it; a `landing_pages`
 * table plus an editor UI would be a week of work for that. Everything that
 * *does* change often — prices, classes, photos, the trial offer — is still
 * read live from the CMS by the page that renders these.
 *
 * The live data does the heavy lifting on freshness; this file only has to
 * carry the words that are unique to each search. Keep them unique: four pages
 * repeating one paragraph is one page as far as Google is concerned.
 */
export type LandingPageSection = {
  heading: string;
  body: string[];
};

export type LandingPage = {
  /** URL segment. Same across locales so a link works whichever site you copy it from. */
  slug: string;
  title: string;
  description: string;
  kicker: string;
  h1: string;
  lede: string;
  sections: LandingPageSection[];
  faq: { question: string; answer: string }[];
  /** Prefilled WhatsApp text, so the admin knows which page the enquiry came from. */
  whatsappMessage: string;
  ctaLabel: string;
  breadcrumb: string;
};

const en: LandingPage[] = [
  {
    slug: "muay-thai-cheras",
    title: "Muay Thai in Cheras — Taman Connaught",
    description:
      "Muay Thai gym on Jalan Cerdas, Taman Connaught, Cheras. Evening group classes, kids classes and personal training. Gloves provided, beginners welcome. Book a trial on WhatsApp.",
    kicker: "Cheras · Taman Connaught",
    h1: "Muay Thai in Cheras",
    lede: "Hercules Factory is a Muay Thai gym on Jalan Cerdas in Taman Connaught. Evening classes four nights a week, a kids class on Sunday, and coaching that starts wherever you happen to be starting.",
    breadcrumb: "Muay Thai Cheras",
    sections: [
      {
        heading: "A neighbourhood gym, not a chain",
        body: [
          "Cheras is big, and most people looking for Muay Thai here end up scrolling through franchise timetables in Mid Valley or Bukit Bintang — thirty minutes of traffic each way before you have thrown a single kick. That commute is the reason most people quit in month two.",
          "We are in Taman Connaught, the same neighbourhood as the MRT station of that name, on the Kajang Line. If you live in Cheras, Taman Segar, Taman Midah, Bandar Tun Razak or anywhere along Jalan Cheras, training here is a short drive rather than an evening out. There is street parking outside.",
          "Because we are one gym and not a network, the coach taking your class is the same coach every week. He learns your name, he remembers that your left kick drops, and he tells you about it. That is the whole difference.",
        ],
      },
      {
        heading: "Who trains here",
        body: [
          "Three groups, in roughly equal numbers. People who want to get fit and are bored of the treadmill. People who have always wanted to learn to fight properly and never had a reason to start. And a smaller group training seriously toward competition.",
          "Nobody is separated into levels by ego. A class holds a first-timer and someone three years in, and the pad work is scaled between them. Beginners are not parked in a corner doing jumping jacks — you learn the actual technique on your first night.",
          'Women train in every class. So do people in their forties and fifties, and people who have not exercised in a decade. The honest answer to "am I fit enough for this" is that the class is what makes you fit; you do not need to arrive that way.',
        ],
      },
      {
        heading: "What an evening looks like",
        body: [
          "Wrap up, skip, warm up. Then technique — one or two things, drilled properly, rather than a highlight reel you forget by Thursday. Then rounds on the pads with a coach, then bag work, then conditioning if there is time left in you.",
          "You leave soaked. Most people find the first two weeks brutal and the third week is where it clicks, which is roughly when the fitness arrives without you noticing it happen.",
          "Clinch and sparring are available for people who want them and completely optional for people who do not. Nobody is put in front of a harder partner than they asked for.",
        ],
      },
      {
        heading: "Finding us",
        body: [
          "Jalan Cerdas, Taman Connaught, 56000 Kuala Lumpur. The map at the bottom of this page will route you door to door.",
          "Group classes run Monday, Tuesday, Thursday and Friday evenings, 7pm to 10pm — late enough to make it after work from the city, KLCC or Bangsar without sprinting. The kids class runs on Sunday, and personal training is by appointment on any day.",
          "Bring shorts, a shirt and water. Gloves are here for you to use, so there is nothing to buy before your first session.",
        ],
      },
    ],
    faq: [
      {
        question: "Where exactly in Cheras is the gym?",
        answer:
          "Jalan Cerdas, Taman Connaught, 56000 Kuala Lumpur — the same neighbourhood as the Taman Connaught MRT station on the Kajang Line. There is street parking outside the gym.",
      },
      {
        question: "What nights do classes run?",
        answer:
          "Group classes are Monday, Tuesday, Thursday and Friday, 7pm to 10pm. The kids class is on Sunday, and personal training is by appointment. WhatsApp us to confirm the session you want.",
      },
      {
        question: "Do I need to book, or can I walk in?",
        answer:
          "Message us on WhatsApp first. It takes a minute and it means a coach knows to expect you and can put you in the right class.",
      },
      {
        question: "Do you take complete beginners?",
        answer:
          "Yes, and most nights there is more than one. Classes are beginner-friendly by design and gloves are provided for your trial.",
      },
    ],
    whatsappMessage:
      "Hi Hercules Factory! I found your Cheras page — I'd like to try a class.",
    ctaLabel: "Book a trial in Cheras",
  },
  {
    slug: "muay-thai-kuala-lumpur",
    title: "Muay Thai Classes in Kuala Lumpur",
    description:
      "Muay Thai training in Kuala Lumpur, based in Taman Connaught, Cheras. Evening group classes, kids classes and one-to-one coaching. Beginners welcome, gloves provided.",
    kicker: "Kuala Lumpur",
    h1: "Muay Thai Classes in Kuala Lumpur",
    lede: "There is no shortage of places to hit a bag in KL. There are fewer places where somebody watches you do it and corrects you. Hercules Factory is a Muay Thai gym in Taman Connaught, Cheras, built around coaching rather than class capacity.",
    breadcrumb: "Muay Thai Kuala Lumpur",
    sections: [
      {
        heading: "Why train Muay Thai in KL at all",
        body: [
          "Muay Thai is the most efficient hour of exercise most people will ever do — it works your legs, your core and your lungs at the same time, and it holds your attention in a way a stationary bike never will. You are learning something, so you keep turning up. That is the entire trick to fitness that lasts.",
          "It is also genuinely useful. Eight points of contact, footwork, distance, timing, and the composure that comes from having stood in front of someone who is trying to hit you. None of that is theoretical.",
          "And it is sociable in a way most KL gyms are not. You cannot hold pads for someone without talking to them. People arrive alone and end up with a group.",
        ],
      },
      {
        heading: "What makes us different from a big-box gym",
        body: [
          "Class sizes stay small enough that everybody gets real pad rounds with a coach, not a queue behind one. The coach is the same face every week, so your corrections carry over from one session to the next instead of resetting.",
          "There is no lock-in contract designed to keep charging you after you stop coming. There is a trial, single sessions, credit packs and an unlimited pass. Pick what matches how often you will realistically train — the prices are on this page and on the homepage, in full, with nothing to unlock in a sales call.",
          "We are also not a fitness brand that happens to sell kickboxing. The technique taught here is Muay Thai as it is actually fought.",
        ],
      },
      {
        heading: "Getting here from around the city",
        body: [
          "The gym is on Jalan Cerdas in Taman Connaught, off Jalan Cheras — south-east of the city centre and easy to reach against the evening traffic rather than into it. The MRT Kajang Line runs to Taman Connaught station.",
          "That puts us in comfortable range of Cheras, Bandar Tun Razak, Sungai Besi, Seri Kembangan, Balakong, Bandar Sungai Long and Kajang, and reachable from the city centre, Ampang and Bangsar on the way home.",
          "Classes start at 7pm — late enough that a normal KL working day does not rule you out.",
        ],
      },
      {
        heading: "Starting",
        body: [
          "Message us on WhatsApp. Tell us roughly what you are after — fitness, technique, or competition — and we will tell you which class to come to and when.",
          "Come in shorts and a shirt with water. Gloves are provided for your first session, so there is nothing to buy up front and nothing to commit to before you have seen the place.",
        ],
      },
    ],
    faq: [
      {
        question: "Where in KL is the gym?",
        answer:
          "Jalan Cerdas, Taman Connaught, 56000 Kuala Lumpur, in Cheras — off Jalan Cheras, near the Taman Connaught MRT station on the Kajang Line.",
      },
      {
        question: "What are the class times?",
        answer:
          "Group classes run Monday, Tuesday, Thursday and Friday from 7pm to 10pm. Kids class is Sunday. Personal training is by appointment.",
      },
      {
        question: "Do you have a contract or lock-in?",
        answer:
          "No. There is a trial class, single drop-in sessions, credit packs and an unlimited pass. You choose what suits how often you train.",
      },
      {
        question: "Is there parking?",
        answer:
          "Yes, street parking outside the gym. The Taman Connaught MRT station is also in the same neighbourhood if you would rather not drive.",
      },
    ],
    whatsappMessage:
      "Hi Hercules Factory! I'm looking for Muay Thai classes in KL — can you tell me more?",
    ctaLabel: "Book your first class",
  },
  {
    slug: "kids-muay-thai-kl",
    title: "Kids Muay Thai Classes in Cheras, KL",
    description:
      "Sunday Muay Thai classes for kids in Taman Connaught, Cheras, Kuala Lumpur. Coach-led, discipline first, no equipment to buy. Message us on WhatsApp to book a trial.",
    kicker: "Kids · Sunday",
    h1: "Kids Muay Thai Classes in Cheras, KL",
    lede: "A Sunday Muay Thai class for children at our gym in Taman Connaught. Structure, fitness and a coach who holds them to it — without the shouting.",
    breadcrumb: "Kids Muay Thai KL",
    sections: [
      {
        heading: "What kids actually get out of it",
        body: [
          "Attention span, mostly. A Muay Thai class asks a child to stand still, listen, and then do a specific thing on command — repeatedly, for an hour. That is a skill, and it transfers to school in a way parents notice before the kids do.",
          "Then the physical side: balance, coordination, real cardiovascular fitness, and a body that knows where it is in space. Kids who play no other sport catch up quickly here because the entry requirement is zero.",
          "And confidence, which is the one parents ask about most. Not the loud kind. The quiet kind that comes from being able to do something difficult that you could not do three months ago.",
        ],
      },
      {
        heading: "How the class is run",
        body: [
          "Coach-led, start to finish, with a warm-up, technique, pad work and games that are really conditioning in disguise. Children are corrected individually rather than left to copy whatever the child in front is doing.",
          "Contact is controlled and age-appropriate. Nobody is put into hard sparring. The pads take the power, and partner work is supervised the whole way through.",
          "Discipline is part of it — bowing in, listening when the coach talks, not swinging at each other between rounds. That structure is deliberate, and it is most of the reason the class works.",
        ],
      },
      {
        heading: "Practical questions parents ask",
        body: [
          "Nothing to buy. Gloves are here. Shorts, a t-shirt and a water bottle is the whole kit list, and bare feet on the mats.",
          "Parents are welcome to stay and watch. Most do for the first few weeks and then stop, which is usually a good sign.",
          "The class runs on Sunday at our gym on Jalan Cerdas, Taman Connaught — easy from Cheras, Balakong, Sungai Long, Kajang and Seri Kembangan. WhatsApp us for this week's exact time, since it moves occasionally around events.",
        ],
      },
    ],
    faq: [
      {
        question: "What age do you take?",
        answer:
          "Message us on WhatsApp with your child's age and we will tell you honestly whether the class is a good fit yet. We would rather say wait six months than take a child who will not enjoy it.",
      },
      {
        question: "When is the kids class?",
        answer:
          "Sundays, at our gym on Jalan Cerdas, Taman Connaught, Cheras. WhatsApp us to confirm this week's time before you come.",
      },
      {
        question: "Does my child need gloves or equipment?",
        answer:
          "No. Gloves are provided. Shorts, a t-shirt and a water bottle is all they need — training is barefoot on the mats.",
      },
      {
        question: "Will my child get hurt?",
        answer:
          "Contact is controlled and supervised, and there is no hard sparring in the kids class. Power goes into pads and bags, not into other children.",
      },
      {
        question: "Can I stay and watch?",
        answer: "Yes, parents are welcome to watch the whole session.",
      },
    ],
    whatsappMessage:
      "Hi Hercules Factory! I'd like to ask about the kids Muay Thai class.",
    ctaLabel: "Ask about the kids class",
  },
  {
    slug: "muay-thai-for-beginners-kl",
    title: "Muay Thai for Beginners in KL",
    description:
      "Never trained before? Muay Thai beginner classes in Taman Connaught, Cheras, KL. Gloves provided, no fitness requirement, no contract. Here is exactly what your first class looks like.",
    kicker: "Beginners",
    h1: "Muay Thai for Beginners in Kuala Lumpur",
    lede: "The hardest part of Muay Thai is walking in the first time. This page exists to make that easier — here is exactly what happens, what to bring, and what nobody will make you do.",
    breadcrumb: "Muay Thai for Beginners",
    sections: [
      {
        heading: "You do not need to be fit first",
        body: [
          "This is the single most common reason people put off starting, and it is backwards. Nobody arrives fit. The class is what makes you fit, and it does it faster than the gym you have been meaning to go back to.",
          "Work at whatever pace you have. Sit a round out if you need to; every experienced person in the room has done it. The coaches would far rather you finish the hour honestly than blow up in the first fifteen minutes trying to keep up with someone who has been doing this for three years.",
          "There is no minimum age, weight, flexibility or background. People start here in their forties. People start here having never played a sport.",
        ],
      },
      {
        heading: "What actually happens in your first class",
        body: [
          "You arrive, someone shows you where to put your things and how to wrap your hands — you will not be left to figure that out. Then a warm-up: skipping, movement, nothing complicated.",
          "Then technique. On night one that is usually the stance, the jab, and the teep or the round kick. One or two things, drilled slowly. You will not be handed a twelve-strike combination and told to keep up.",
          "Then pads — a coach or a partner holds, and you hit. This is the part everyone remembers, and it is the first moment it stops feeling like exercise and starts feeling like a skill. Then bag work, then conditioning, then you sit on the floor for a while wondering what happened to your legs.",
          "No sparring. Not on your first night, not on your tenth, not until you ask for it. Beginners are never put in front of someone throwing hard.",
        ],
      },
      {
        heading: "What to bring",
        body: [
          "Shorts or leggings, a t-shirt, and a bottle of water. That is genuinely all.",
          "Gloves are provided for your trial, so do not buy anything yet. When you have been a few weeks and know you are staying, ask a coach what to get — you will spend your money better with their advice than with a shopping search.",
          "Training is barefoot on the mats, so no shoes needed. Come ten minutes early on your first night.",
        ],
      },
      {
        heading: "Where and when",
        body: [
          "Hercules Factory, Jalan Cerdas, Taman Connaught, 56000 Kuala Lumpur — in Cheras, near the Taman Connaught MRT station.",
          "Beginner-friendly group classes run Monday, Tuesday, Thursday and Friday from 7pm to 10pm. If you would rather have your first hour one-to-one before joining a group, personal training is available by appointment — some people much prefer starting that way, and it is a completely reasonable thing to ask for.",
          "Message us on WhatsApp and say it is your first time. We will take it from there.",
        ],
      },
    ],
    faq: [
      {
        question: "I've never trained before. Will I be out of my depth?",
        answer:
          "No. Classes are built to hold beginners and experienced members at the same time, and the technique is taught from the stance up. Most nights there is more than one person on their first session.",
      },
      {
        question: "Do I need my own gloves?",
        answer:
          "No. Gloves are available for you to use during your trial and your classes. Buy your own later, once you know you are staying.",
      },
      {
        question: "Will I have to spar?",
        answer:
          "Not unless you want to. Sparring is optional and beginners are never put in front of a harder partner than they asked for.",
      },
      {
        question: "Can women join?",
        answer: "Yes. Women train in every class here, beginners included.",
      },
      {
        question: "How do I book my first class?",
        answer:
          "Message us on WhatsApp, tell us it is your first time, and we will put you in a suitable session.",
      },
    ],
    whatsappMessage:
      "Hi Hercules Factory! I'm a complete beginner and I'd like to book a trial class.",
    ctaLabel: "Book your first class",
  },
];

/**
 * Same four pages in Chinese, on the same slugs. Translated rather than
 * transliterated — a `/zh` page that reads like machine output ranks for
 * nothing and reflects badly on the gym.
 */
const zh: LandingPage[] = [
  {
    slug: "muay-thai-cheras",
    title: "蕉赖泰拳课程 — 康乐花园",
    description:
      "位于吉隆坡蕉赖康乐花园 Jalan Cerdas 的泰拳馆。晚间团体课、周日儿童班、私人教练课。提供拳套，新手欢迎。WhatsApp 报名体验课。",
    kicker: "蕉赖 · 康乐花园",
    h1: "蕉赖泰拳课程",
    lede: "Hercules Factory 是一间位于蕉赖康乐花园 Jalan Cerdas 的泰拳馆。每周四晚团体课、周日儿童班，教练从你现在的程度开始教。",
    breadcrumb: "蕉赖泰拳",
    sections: [
      {
        heading: "社区拳馆，不是连锁品牌",
        body: [
          "蕉赖很大。大部分想学泰拳的人，最后都在看 Mid Valley 或武吉免登的连锁课表——来回塞车一小时，才踢得到第一脚。这段车程，就是多数人练两个月就放弃的真正原因。",
          "我们在康乐花园，和 MRT 加影线的 Taman Connaught 站同一个社区。住在蕉赖、Taman Segar、Taman Midah、Bandar Tun Razak 或 Jalan Cheras 沿线，来这里只是几分钟车程。门口有路边停车位。",
          "因为我们只有一间馆，不是连锁网络，所以每周带你上课的都是同一位教练。他记得你的名字，也记得你的左踢会掉手——然后会当场纠正你。差别就在这里。",
        ],
      },
      {
        heading: "在这里训练的人",
        body: [
          "大致三类，人数相当。想减脂、练体能，但已经受够跑步机的人；一直想学会真正打拳、只差一个开始理由的人；以及少数认真备赛的选手。",
          "我们不会按程度把人分开丢在角落。同一堂课里有第一次来的人，也有练了三年的人，打靶的强度会分开调。新手第一晚就学真正的技术，不是在旁边跳开合跳。",
          "每一堂课都有女生。也有四五十岁、十年没运动过的人。「我体能够不够」这个问题，老实的答案是：课本身就是让你变强的过程，你不需要先练好才来。",
        ],
      },
      {
        heading: "一堂课长什么样",
        body: [
          "缠手带、跳绳、热身。接着技术——一两个动作反复练扎实，而不是塞给你一堆隔天就忘的花式。然后跟教练打靶、打沙包，还有力气的话再做体能。",
          "你会全身湿透地离开。多数人觉得头两周很难熬，第三周开始「通」了——体能通常也是在那时候不知不觉出现的。",
          "内围（clinch）和对打是想练的人才练，不想练完全没问题。没有人会被安排给比自己要求更强的对手。",
        ],
      },
      {
        heading: "地点与时间",
        body: [
          "Jalan Cerdas, Taman Connaught, 56000 Kuala Lumpur。页面下方的地图可以直接导航到门口。",
          "团体课：星期一、二、四、五晚上 7 点到 10 点——从市中心、KLCC 或 Bangsar 下班后赶得上。儿童班在星期日，私人教练课任何一天都可以预约。",
          "带运动短裤、上衣和水就好。拳套馆内提供，第一次来什么都不用买。",
        ],
      },
    ],
    faq: [
      {
        question: "拳馆在蕉赖哪里？",
        answer:
          "Jalan Cerdas, Taman Connaught, 56000 Kuala Lumpur——和 MRT 加影线 Taman Connaught 站同一个社区。门口有路边停车位。",
      },
      {
        question: "什么时候有课？",
        answer:
          "团体课星期一、二、四、五晚上 7 点到 10 点；儿童班星期日；私人教练课需预约。想上哪一堂，WhatsApp 我们确认。",
      },
      {
        question: "需要先预约还是可以直接来？",
        answer:
          "请先用 WhatsApp 联系我们。一分钟的事，教练会知道你要来，也能安排适合你的班。",
      },
      {
        question: "完全没基础可以吗？",
        answer:
          "可以，而且几乎每晚都不只你一个新手。课程本来就为新手设计，体验课也提供拳套。",
      },
    ],
    whatsappMessage:
      "你好 Hercules Factory！我在蕉赖页面看到你们，想报名体验课。",
    ctaLabel: "预约蕉赖体验课",
  },
  {
    slug: "muay-thai-kuala-lumpur",
    title: "吉隆坡泰拳课程",
    description:
      "吉隆坡泰拳训练，位于蕉赖康乐花园。晚间团体课、儿童班、一对一教学。新手欢迎，提供拳套，无绑约。",
    kicker: "吉隆坡",
    h1: "吉隆坡泰拳课程",
    lede: "吉隆坡不缺可以打沙包的地方，缺的是有人看着你打、并且纠正你的地方。Hercules Factory 位于蕉赖康乐花园，整间馆是围绕「教」而不是「塞人数」建起来的。",
    breadcrumb: "吉隆坡泰拳",
    sections: [
      {
        heading: "为什么在吉隆坡练泰拳",
        body: [
          "泰拳大概是多数人能做到最有效率的一小时运动——同时练腿、核心和心肺，而且它会抓住你的注意力，健身脚踏车做不到这点。因为你在「学东西」，所以你会继续来。长期坚持的秘诀就只有这个。",
          "它也真的实用。八个攻击点、步法、距离、时机，以及站在一个要打你的人面前还能保持冷静——这些都不是纸上谈兵。",
          "而且它比大部分吉隆坡的健身房更有人味。你没办法一边帮人拿靶一边不说话。很多人自己一个人来，最后交到一群朋友。",
        ],
      },
      {
        heading: "和连锁健身房的差别",
        body: [
          "班级人数控制得住，每个人都真的轮得到跟教练打靶，而不是排队等一个教练。教练每周都是同一个人，所以上周纠正你的东西这周会继续跟进，不会归零。",
          "没有那种你不来了还在扣钱的绑约。有体验课、单堂、次数配套和无限畅打配套。照你实际会来的频率选就好——价格全部公开在这个页面和主页上，不需要先来听一场销售简报。",
          "我们也不是「顺便卖搏击课」的健身品牌。这里教的是实际比赛用的泰拳。",
        ],
      },
      {
        heading: "从市内各区怎么来",
        body: [
          "拳馆在康乐花园 Jalan Cerdas，Jalan Cheras 旁，位于市中心东南方——傍晚是逆车流方向，比往市区容易多了。MRT 加影线可到 Taman Connaught 站。",
          "对蕉赖、Bandar Tun Razak、Sungai Besi、Seri Kembangan、Balakong、Bandar Sungai Long 和加影都很方便，从市中心、安邦或 Bangsar 下班顺路也到得了。",
          "课程 7 点才开始，正常上班日不会因此没得练。",
        ],
      },
      {
        heading: "怎么开始",
        body: [
          "WhatsApp 我们，说明你想练的方向——体能、技术，还是备赛——我们会告诉你该来哪一堂、几点。",
          "穿短裤上衣、带水就行。第一堂提供拳套，不用先花钱，也不用在还没看过场地前先承诺什么。",
        ],
      },
    ],
    faq: [
      {
        question: "拳馆在吉隆坡哪一区？",
        answer:
          "Jalan Cerdas, Taman Connaught, 56000 Kuala Lumpur，位于蕉赖，Jalan Cheras 旁，靠近 MRT 加影线 Taman Connaught 站。",
      },
      {
        question: "上课时间？",
        answer:
          "团体课星期一、二、四、五晚上 7 点至 10 点；儿童班星期日；私人教练课需预约。",
      },
      {
        question: "有绑约吗？",
        answer:
          "没有。有体验课、单堂、次数配套和无限畅打配套，看你练多勤自己选。",
      },
      {
        question: "有停车位吗？",
        answer:
          "门口有路边停车位。不想开车的话，Taman Connaught MRT 站也在同一个社区。",
      },
    ],
    whatsappMessage:
      "你好 Hercules Factory！我在找吉隆坡的泰拳课程，想了解详情。",
    ctaLabel: "预约第一堂课",
  },
  {
    slug: "kids-muay-thai-kl",
    title: "儿童泰拳课程 — 吉隆坡蕉赖",
    description:
      "吉隆坡蕉赖康乐花园的周日儿童泰拳班。教练全程带班，重纪律，无需自备装备。WhatsApp 预约体验。",
    kicker: "儿童班 · 星期日",
    h1: "吉隆坡蕉赖儿童泰拳班",
    lede: "康乐花园拳馆的周日儿童泰拳课。有结构、有体能、有一位真的会要求他们的教练——但不靠吼。",
    breadcrumb: "儿童泰拳",
    sections: [
      {
        heading: "孩子真正学到的东西",
        body: [
          "首先是专注力。一堂泰拳课要求孩子站好、听指令，然后按指令做出一个具体动作，重复一小时。这是一种能力，而且会迁移到课业上——通常家长比孩子先察觉到。",
          "然后是身体面：平衡、协调、真正的心肺能力，以及对自己身体位置的掌握。没有玩其他运动的孩子在这里追得很快，因为门槛是零。",
          "还有自信，这是家长问最多的一项。不是吵闹那种，是「三个月前我做不到、现在做得到」那种安静的自信。",
        ],
      },
      {
        heading: "课怎么上",
        body: [
          "教练全程带班：热身、技术、打靶，加上包装成游戏的体能训练。孩子是一个一个被纠正的，不是让他们照着前面那个小孩乱比。",
          "接触强度受控、按年龄调整，不会安排激烈对打。力量都打在靶和沙包上，对练全程有人看着。",
          "纪律是课程的一部分——上下课行礼、教练说话时安静、回合之间不互相乱挥。这个结构是刻意的，也是这堂课有效的主要原因。",
        ],
      },
      {
        heading: "家长常问的实际问题",
        body: [
          "什么都不用买。拳套我们有。短裤、T 恤、一瓶水就是全部装备，在垫上光脚训练。",
          "家长可以留下来看。多数人前几周会看，之后就不看了——这通常是好现象。",
          "课在星期日，地点是康乐花园 Jalan Cerdas，从蕉赖、Balakong、Sungai Long、加影和 Seri Kembangan 过来都方便。因为偶尔会因活动调整，来之前请 WhatsApp 确认本周时间。",
        ],
      },
    ],
    faq: [
      {
        question: "收几岁的孩子？",
        answer:
          "WhatsApp 告诉我们孩子的年龄，我们会老实说现在适不适合。宁可请你半年后再来，也不想收一个还不会享受这堂课的孩子。",
      },
      {
        question: "儿童班什么时候上？",
        answer:
          "星期日，地点在蕉赖康乐花园 Jalan Cerdas。来之前请 WhatsApp 确认本周时间。",
      },
      {
        question: "需要自备拳套或护具吗？",
        answer: "不用，拳套我们提供。短裤、T 恤和水就够了，训练时在垫上光脚。",
      },
      {
        question: "会不会受伤？",
        answer:
          "接触强度受控且全程有教练看着，儿童班没有激烈对打。力量打在靶和沙包上，不是打在其他孩子身上。",
      },
      {
        question: "我可以在旁边看吗？",
        answer: "可以，家长全程都能观课。",
      },
    ],
    whatsappMessage: "你好 Hercules Factory！我想询问儿童泰拳班。",
    ctaLabel: "询问儿童班",
  },
  {
    slug: "muay-thai-for-beginners-kl",
    title: "泰拳新手入门 — 吉隆坡",
    description:
      "完全没基础？吉隆坡蕉赖康乐花园的泰拳新手班。提供拳套、没有体能门槛、没有绑约。这里写清楚你第一堂课会经历什么。",
    kicker: "新手",
    h1: "吉隆坡泰拳新手入门",
    lede: "泰拳最难的一步，是第一次推门进去。这个页面就是为了让那一步好走一点——第一堂课会发生什么、要带什么、以及没有人会逼你做什么。",
    breadcrumb: "新手入门",
    sections: [
      {
        heading: "你不需要先练好体能",
        body: [
          "这是最多人拖着不开始的理由，而它其实是反过来的。没有人是练好了才来的。课本身就是让你变强的过程，而且比你一直说要回去的健身房快得多。",
          "用你现在有的体能去练。需要就休息一回合，房间里每一个老手都这样做过。教练宁可你诚实地撑完一小时，也不要你前十五分钟硬跟一个练三年的人、然后直接爆掉。",
          "没有年龄、体重、柔软度或运动背景的门槛。有人四十几岁才开始，也有人从来没玩过任何运动。",
        ],
      },
      {
        heading: "第一堂课实际会发生什么",
        body: [
          "你到了，有人告诉你东西放哪、手带怎么缠——不会丢着让你自己研究。然后热身：跳绳、移动，没有复杂的东西。",
          "接着是技术。第一晚通常是基本站架、刺拳，加上前踢或扫踢。一两个动作，慢慢练。不会有人塞给你十二下的连招要你跟上。",
          "然后打靶——教练或同伴拿靶，你打。这是每个人都记得的部分，也是它第一次从「运动」变成「技能」的瞬间。然后打沙包、做体能，最后坐在地上想着自己的腿去哪了。",
          "不用对打。第一晚不用，第十堂也不用，直到你自己想练为止。新手绝不会被排给会用力打的人。",
        ],
      },
      {
        heading: "要带什么",
        body: [
          "运动短裤或紧身裤、一件 T 恤、一瓶水。真的就这些。",
          "体验课提供拳套，所以先别买任何装备。练几周确定要留下来之后，问教练该买什么——那比你自己上网搜好用得多。",
          "在垫上光脚训练，不用带鞋。第一晚请提早十分钟到。",
        ],
      },
      {
        heading: "地点与时间",
        body: [
          "Hercules Factory，Jalan Cerdas, Taman Connaught, 56000 Kuala Lumpur——位于蕉赖，靠近 Taman Connaught MRT 站。",
          "适合新手的团体课在星期一、二、四、五晚上 7 点到 10 点。如果你想先一对一上完第一小时再进团体班，私人教练课可预约——不少人更喜欢这样开始，这也是完全合理的要求。",
          "WhatsApp 我们，说明你是第一次来，剩下的交给我们。",
        ],
      },
    ],
    faq: [
      {
        question: "我完全没练过，会不会跟不上？",
        answer:
          "不会。课程本来就设计成新手和老手同场，技术从站架开始教。多数晚上都不只你一个第一次来的人。",
      },
      {
        question: "需要自己的拳套吗？",
        answer:
          "不需要。体验课和平时上课都有拳套可用。等你确定要长期练，再买自己的。",
      },
      {
        question: "一定要对打吗？",
        answer:
          "不用，除非你自己想。对打是选择性的，新手绝不会被安排给超出自己要求的对手。",
      },
      {
        question: "女生可以练吗？",
        answer: "可以。每一堂课都有女生，包括新手。",
      },
      {
        question: "怎么预约第一堂课？",
        answer: "WhatsApp 我们，说你是第一次来，我们会安排适合的班。",
      },
    ],
    whatsappMessage: "你好 Hercules Factory！我完全是新手，想预约体验课。",
    ctaLabel: "预约第一堂课",
  },
];

const byLocale: Record<Locale, LandingPage[]> = { en, zh };

/** Slugs are shared across locales, so the English list defines the routes. */
export const landingPageSlugs = en.map((page) => page.slug);

export const getLandingPage = (locale: Locale, slug: string) =>
  byLocale[locale]?.find((page) => page.slug === slug);
