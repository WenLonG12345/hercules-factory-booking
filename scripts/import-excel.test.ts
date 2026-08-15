/**
 * Self-check for the import parsers — the money and date paths, where a silent
 * mistake would corrupt the books. Run: bun run test:import
 */
import assert from "node:assert/strict";
import { normalisePhone, parseCsv, toCents, toDate } from "./import-excel";

// CSV: quoted commas, escaped quotes, CRLF, blank rows.
const rows = parseCsv(
  'Name,Amount,Notes\r\n"Tan, Wei Jie",RM 350.00,"said ""ok"""\r\n\r\nPriya,120,\r\n',
);
assert.equal(rows.length, 2);
assert.equal(rows[0].name, "Tan, Wei Jie");
assert.equal(rows[0].notes, 'said "ok"');
assert.equal(rows[1].amount, "120");

// Dates — client's DD/MM/YY, plus ISO passthrough and rejects.
assert.equal(toDate("01/08/26"), "2026-08-01");
assert.equal(toDate("1/8/2026"), "2026-08-01");
assert.equal(toDate("2026-08-01"), "2026-08-01");
assert.equal(toDate("not a date"), null);
assert.equal(toDate("01/13/26"), null); // month 13 — not silently accepted
assert.equal(toDate(""), null);

// Money — cents, never a silent zero.
assert.equal(toCents("RM 350.00"), 35000);
assert.equal(toCents("350"), 35000);
assert.equal(toCents("1,234.50"), 123450);
assert.equal(toCents(""), null);
assert.equal(toCents("n/a"), null);

// Malaysian phone normalisation.
assert.equal(normalisePhone("012-345 6789"), "60123456789");
assert.equal(normalisePhone("60123456789"), "60123456789");
assert.equal(normalisePhone(""), "");

console.log("import-excel self-check passed");
