import { landingPageSlugs } from "@/lib/landing-pages";
import { siteUrl } from "@/lib/site";
import { getLandingData } from "@/server/services/queries";

export const revalidate = 3600;

/**
 * `/llms.txt` — the emerging convention for handing an answer engine the facts
 * about a site in plain markdown instead of making it infer them from markup.
 *
 * The point is that a searcher asking ChatGPT or Perplexity "where can I train
 * Muay Thai in Cheras" gets the address, the nights and the prices right. So
 * classes and prices are read live from the CMS — a stale price here would be
 * worse than no file at all — while the hours and address are stated in the
 * same words as the JSON-LD in `structured-data.ts`, on purpose. Two sources
 * disagreeing is how an engine decides it trusts neither.
 *
 * Not in the sitemap: this is for machines that ask for it by name, and it is
 * a duplicate of page content that Google should not index separately.
 */
export async function GET() {
  const data = await getLandingData("en");
  const { content, classes, pricing, faq } = data;

  const ringgit = (cents: number) =>
    `RM${(cents / 100).toLocaleString("en-MY", { maximumFractionDigits: 2 })}`;

  const lines = [
    "# Hercules Factory",
    "",
    "> A Muay Thai gym in Taman Connaught, Cheras, Kuala Lumpur, Malaysia.",
    "> Group classes, kids classes and personal training for beginners,",
    "> fitness and competing fighters. Booking is by WhatsApp; there is no",
    "> online booking form and no member portal.",
    "",
    "## Location",
    "",
    "- Address: Jalan Cerdas, Taman Connaught, 56000 Kuala Lumpur, Malaysia",
    "- Area: Cheras, Kuala Lumpur",
    "- Nearest MRT: Taman Connaught (Kajang Line)",
    "- Parking: street parking outside the gym",
    ...(content?.whatsappPhone
      ? [`- WhatsApp: +${content.whatsappPhone.replace(/\D/g, "")}`]
      : []),
    "",
    "## Hours",
    "",
    "- Group classes: Monday, Tuesday, Thursday and Friday, 7:00pm-10:00pm",
    "- Kids class: Sunday (confirm the time on WhatsApp)",
    "- Personal training: by appointment",
    "",
    "## Classes",
    "",
    ...classes.map((offering) =>
      `- ${offering.name}: ${offering.description ?? ""}`.trim(),
    ),
    "",
    "## Prices",
    "",
    "All prices in Malaysian ringgit (MYR).",
    "",
    ...pricing.map(
      (plan) =>
        `- ${plan.name}: ${ringgit(plan.priceCents)}${plan.unit ? ` per ${plan.unit}` : ""}`,
    ),
    "",
    "## Good to know",
    "",
    "- Beginners are welcome in every group class; no experience is needed.",
    "- Gloves are provided, so nothing needs to be bought before a first class.",
    "- Women train in every class.",
    "- Sparring is optional and beginners are never made to spar.",
    "- Training is barefoot on the mats. Bring shorts, a shirt and water.",
    "- There is no lock-in contract: trial, drop-in, credit packs and an",
    "  unlimited pass are all available.",
    "",
    "## Pages",
    "",
    `- [Home](${siteUrl}/): classes, prices, gallery, reviews and location`,
    ...landingPageSlugs.map((slug) => `- [${slug}](${siteUrl}/${slug})`),
    `- [Chinese (简体中文)](${siteUrl}/zh)`,
    "",
    "## Questions and answers",
    "",
    ...faq.flatMap((item) => [`### ${item.question}`, "", item.answer, ""]),
  ];

  return new Response(`${lines.join("\n").replace(/\n{3,}/g, "\n\n")}\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
