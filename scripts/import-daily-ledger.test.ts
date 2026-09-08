import assert from "node:assert/strict";
import { parse } from "./import-daily-ledger";

const rows = parse(
  [
    "# comment",
    "2025-06-01|income|Per Entry|20|JUN ZHE PER ENRTY",
    "2025-06-06|income|10 Credit|172.5|OLIVIA (NEW),3 HAND WRAP",
    "2025-06-27|expense|UNIFI|220.50|UNIFI JUNE",
  ].join("\n"),
);

assert.equal(rows.length, 3);
assert.equal(rows[0].amountCents, 2000);
assert.equal(rows[1].amountCents, 17250, "money stays integer cents");
assert.equal(rows[2].direction, "expense");

for (const bad of [
  "01/06/2025|income|Per Entry|20|x",
  "2025-06-01|profit|Per Entry|20|x",
  "2025-06-01|income|Per Entry|0|x",
  "2025-06-01|income|Nasi Lemak|20|x",
])
  assert.throws(() => parse(bad), `should reject: ${bad}`);

console.log("import-daily-ledger: ok");
