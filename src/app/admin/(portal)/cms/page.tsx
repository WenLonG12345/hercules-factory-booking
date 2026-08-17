"use client";

/* Hallmark · surface: admin app (not a marketing page — no macrostructure)
 * genre: modern-minimal · system: preserved (stone ground, white cards,
 *   red-700 primary, amber-300 secondary) · no new tokens, no new fonts
 * change: eleven stacked sections behind one anchor-chip row → four hash-routed
 *   workspaces, one panel mounted at a time — 2026-08-17
 * pre-emit critique: P4 H5 E4 S4 R5 V4
 */

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/admin-shell";
import { api } from "@/lib/trpc";
import { MediaPanel } from "./media-panel";
import { OfferingPanel } from "./offering-panel";
import { SitePanel } from "./site-panel";
import { WordsPanel } from "./words-panel";

/**
 * Four workspaces instead of eleven stacked sections. `sections` lists the
 * anchors each one owns, so an old `#gallery` link still lands on the right
 * workspace — and, because the tab ids are not element ids, clicking a tab
 * changes the hash without the browser scroll-jumping.
 */
const TABS = [
  {
    id: "site",
    label: "Site",
    blurb: "Hero, WhatsApp, section headings, address, footer links.",
    sections: ["hero", "location", "social"],
  },
  {
    id: "offering",
    label: "Offering",
    blurb: "Why train here, the classes, and the rate card.",
    sections: ["why", "classes", "pricing"],
  },
  {
    id: "media",
    label: "Media",
    blurb: "Visitor submissions, the gallery, the promotion poster.",
    sections: ["submissions", "gallery", "promotions"],
  },
  {
    id: "words",
    label: "Words",
    blurb: "Reviews and the FAQ accordion.",
    sections: ["reviews", "faq"],
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

const tabFromHash = (hash: string): TabId =>
  TABS.find((tab) => tab.id === hash || tab.sections.some((s) => s === hash))
    ?.id ?? "site";

export default function CmsPage() {
  const { data, isLoading } = api.cms.allContent.useQuery();
  const [tab, setTab] = useState<TabId>("site");

  // The hash is the tab state: deep-linkable, survives a reload, and the back
  // button works without a router round-trip. Read after mount so the server
  // and first client render agree.
  useEffect(() => {
    const sync = () => setTab(tabFromHash(window.location.hash.slice(1)));
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  if (isLoading || !data) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 rounded bg-stone-200" />
        <div className="h-14 rounded-lg bg-stone-200" />
        {["a", "b", "c"].map((k) => (
          <div key={k} className="h-52 rounded-xl bg-stone-200" />
        ))}
      </div>
    );
  }

  const active = TABS.find((item) => item.id === tab) ?? TABS[0];
  const pendingCount = data.gallery.filter(
    (image) => image.submittedBy && !image.isActive,
  ).length;

  return (
    <>
      <PageHeader eyebrow="Website" title="Landing page CMS" />

      <nav
        aria-label="CMS sections"
        className="mb-3 flex gap-1 overflow-x-auto rounded-lg border border-stone-200 bg-white p-1 shadow-sm"
      >
        {TABS.map((item) => (
          <a
            key={item.id}
            aria-current={item.id === tab ? "page" : undefined}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-semibold transition ${
              item.id === tab
                ? "bg-stone-950 text-white"
                : "text-stone-600 hover:bg-stone-100"
            }`}
            href={`#${item.id}`}
          >
            {item.label}
            {item.id === "media" && pendingCount > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-300 px-1.5 text-xs font-black text-stone-950">
                {pendingCount}
              </span>
            ) : null}
          </a>
        ))}
      </nav>
      <p className="mb-6 text-sm text-stone-500">{active.blurb}</p>

      {tab === "site" ? <SitePanel data={data} /> : null}
      {tab === "offering" ? <OfferingPanel data={data} /> : null}
      {tab === "media" ? <MediaPanel data={data} /> : null}
      {tab === "words" ? <WordsPanel data={data} /> : null}
    </>
  );
}
