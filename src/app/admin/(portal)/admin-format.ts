// Pure helpers shared by the admin pages — safe to import in client components.

export const PACKAGE_TYPE_LABEL = {
  unlimited: "Unlimited",
  credit: "10 Credits",
  pt: "PT",
} as const;

export const PAYMENT_METHOD_LABEL = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  tng: "Touch 'n Go",
  card: "Card",
  other: "Other",
} as const;

export const SOURCE_LABEL = {
  instagram: "Instagram",
  xiaohongshu: "Xiaohongshu",
  whatsapp: "WhatsApp",
  walk_in: "Walk-in",
  referral: "Referral",
  other: "Other",
} as const;

export const EXPENSE_CATEGORY_LABEL = {
  rent: "Rent",
  utilities: "Utilities",
  coach_salary: "Coach salary",
  marketing: "Marketing",
  equipment: "Equipment",
  cleaning: "Cleaning",
  maintenance: "Maintenance",
  other: "Others",
} as const;

export const SESSION_TYPE_LABEL = {
  class: "Class",
  pt: "PT",
  trial: "Trial",
} as const;

/** YYYY-MM-DD in local time. `toISOString()` rolls the day back in UTC+8. */
function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function today() {
  return isoDate(new Date());
}

export function currentMonth() {
  return today().slice(0, 7);
}

/** "120" or "120.50" → cents. Money never travels as a float. */
export function ringgitToCents(value: FormDataEntryValue | null) {
  const amount = Number(String(value ?? "0").replace(/[^\d.]/g, ""));
  return Math.round((Number.isFinite(amount) ? amount : 0) * 100);
}

export function centsToRinggit(cents: number) {
  return (cents / 100).toFixed(2);
}

export function remaining(pkg: {
  totalCredits: number | null;
  usedCredits: number;
}) {
  return pkg.totalCredits === null ? null : pkg.totalCredits - pkg.usedCredits;
}

export function packageStatus(pkg: {
  totalCredits: number | null;
  usedCredits: number;
  expiryDate: string;
}) {
  const left = remaining(pkg);
  if (pkg.expiryDate < today()) return "expired" as const;
  if (left !== null && left <= 0) return "expired" as const;
  if (left !== null && left <= 2) return "expiring" as const;
  const inTwoWeeks = new Date();
  inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);
  if (pkg.expiryDate <= isoDate(inTwoWeeks)) return "expiring" as const;
  return "active" as const;
}

export const STATUS_TONE = {
  active: "green",
  expiring: "amber",
  expired: "red",
} as const;

/** Monday-first week containing `date`. */
export function weekRange(date: string) {
  const d = new Date(`${date}T00:00:00`);
  const day = (d.getDay() + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const cursor = new Date(monday);
    cursor.setDate(monday.getDate() + i);
    return isoDate(cursor);
  });
}

export function shiftDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

/** Monday-first grid of whole weeks covering the month containing `date`. */
export function monthGrid(date: string) {
  const [year, month] = date.split("-").map(Number);
  const start = weekRange(`${date.slice(0, 7)}-01`)[0];
  const lead = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const weeks = Math.ceil((lead + daysInMonth) / 7);
  return Array.from({ length: weeks * 7 }, (_, i) => shiftDays(start, i));
}

/** Lands on the 1st — the schedule anchor only ever needs the month. */
export function shiftMonths(date: string, months: number) {
  const [year, month] = date.split("-").map(Number);
  return isoDate(new Date(year, month - 1 + months, 1));
}

export function monthLabel(date: string) {
  return new Intl.DateTimeFormat("en-MY", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${date.slice(0, 7)}-01T00:00:00`));
}

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function toCsv(rows: (string | number)[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return /[",\n]/.test(value)
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        })
        .join(","),
    )
    .join("\n");
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
