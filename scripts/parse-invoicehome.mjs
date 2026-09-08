/**
 * One-off: turns the saved InvoiceHome "My Customers" pages
 * (docs/customer/page*.html) into import/customers.csv for `bun db:import`.
 *
 *   node scripts/parse-invoicehome.mjs
 *
 * The list shows one cell per customer, "NAME, IDENTIFIER". The identifier is
 * whatever the gym typed into InvoiceHome: usually a Malaysian mobile, often an
 * IC number, occasionally a company registration number or a +86 mobile. Real
 * mobiles go to `phone`; everything else goes to `ic`, which is what the
 * customers table now carries for people who never gave a number.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const dir = "docs/customer";
const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();

const rows = [];
for (const file of readdirSync(dir)
  .filter((f) => /^page\d+\.html$/.test(f))
  .sort()) {
  const html = readFileSync(`${dir}/${file}`, "utf8");
  for (const tr of html.split(/<tr\b/).slice(1)) {
    const cells = [...tr.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map((m) =>
      decode(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")),
    );
    if (cells.length < 5) continue; // header / pagination rows
    const id = tr.match(/\/customers\/(\d+)/)?.[1] ?? "";
    // Split on the last comma, and only when the tail is identifier-shaped —
    // names themselves contain commas ("CHI WAH , HIN CHENG, 011-...").
    const [, head = cells[0], tail = ""] =
      cells[0].match(/^(.*),([^,]*)$/) ?? [];
    const hasId = tail.replace(/\D/g, "").length >= 7;
    rows.push({
      id,
      name: (hasId ? head : cells[0]).trim(),
      raw: hasId ? tail.trim() : "",
      docs: cells[1],
      paid: cells[3],
      total: cells[4],
    });
  }
}

/** Malaysian mobile: local 01X + 8-9 digits, with or without the 60 prefix. */
const myMobile = (raw) => {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("60")) d = `0${d.slice(2)}`;
  else if (d.startsWith("1")) d = `0${d}`;
  return /^01\d{8,9}$/.test(d) ? `6${d}` : null;
};

/** IC: 12 digits, first six a plausible YYMMDD. Dashes optional. */
const isIc = (raw) => {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 12) return false;
  const [mm, dd] = [Number(d.slice(2, 4)), Number(d.slice(4, 6))];
  return mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31;
};

/** Foreign mobile, e.g. +86 — kept with its "+" so WhatsApp links stay right. */
const foreign = (raw) =>
  raw.trim().startsWith("+") && /^\+[\d\s-]{9,16}$/.test(raw.trim())
    ? `+${raw.replace(/\D/g, "")}`
    : null;

for (const r of rows) {
  const phone = myMobile(r.raw) ?? (isIc(r.raw) ? null : foreign(r.raw));
  r.phone = phone ?? "";
  r.ic = phone ? "" : r.raw;
}

// InvoiceHome holds the same person twice under a longer and a shorter name
// ("李旦" / "ALAMO 李旦"). Same identifier plus a contained name means one
// person; same identifier with unrelated names means siblings sharing a phone,
// and both of those are real customers.
const byIdentifier = new Map();
for (const r of rows) {
  const key = r.phone || r.ic;
  if (!key) continue;
  byIdentifier.set(key, [...(byIdentifier.get(key) ?? []), r]);
}
const merged = [];
for (const group of byIdentifier.values()) {
  for (const r of group) {
    const longer = group.find(
      (other) =>
        other !== r &&
        other.name.toLowerCase().includes(r.name.toLowerCase()) &&
        other.name.length > r.name.length,
    );
    if (longer) {
      r.skip = true;
      merged.push([r.name, longer.name]);
    }
  }
}

const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
const keep = rows.filter((r) => !r.skip);

writeFileSync(
  "import/customers.csv",
  `${[
    "name,phone,ic,age,gender,emergency_contact,date_joined,source,notes",
    ...keep.map((r) =>
      [
        r.name,
        r.phone,
        r.ic,
        "",
        "",
        "",
        "",
        "",
        `InvoiceHome #${r.id} · ${r.docs} invoices · ${r.paid} paid of ${r.total}`,
      ]
        .map(q)
        .join(","),
    ),
  ].join("\n")}\n`,
);

const counts = {
  phone: keep.filter((r) => r.phone && !r.phone.startsWith("+")).length,
  foreign: keep.filter((r) => r.phone.startsWith("+")).length,
  ic: keep.filter((r) => !r.phone && r.ic).length,
  neither: keep.filter((r) => !r.phone && !r.ic).length,
};
console.log(
  `parsed ${rows.length} rows -> import/customers.csv (${keep.length})`,
);
console.log(
  `  MY mobile ${counts.phone}   foreign ${counts.foreign}   ic only ${counts.ic}   name only ${counts.neither}`,
);
console.log(`merged ${merged.length} duplicate records:`);
for (const [from, into] of merged) console.log(`  "${from}" -> "${into}"`);
console.log("name only (no identifier on file):");
for (const r of keep.filter((x) => !x.phone && !x.ic))
  console.log(`  ${r.name}`);
