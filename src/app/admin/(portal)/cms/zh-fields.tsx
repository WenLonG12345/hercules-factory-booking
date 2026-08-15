"use client";

import { Field, Input, Textarea } from "@/components/ui/form";

const humanize = (key: string) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

/**
 * Chinese overrides for one CMS row, collapsed behind a native `<details>` so
 * the English forms stay as short as they were. Inputs are named `zh.<field>`;
 * `readZh` picks them back out of the FormData, so neither side has to keep a
 * key list in sync.
 */
export function ZhFields({
  fields,
  multiline = [],
  value,
}: {
  fields: readonly string[];
  multiline?: readonly string[];
  value?: Record<string, string> | null;
}) {
  return (
    <details className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
      <summary className="cursor-pointer text-sm font-semibold text-stone-700">
        中文 translation{" "}
        <span className="font-normal text-stone-500">
          — blank fields fall back to English on /zh
        </span>
      </summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <Field
            key={field}
            className={multiline.includes(field) ? "sm:col-span-2" : undefined}
            label={humanize(field)}
          >
            {multiline.includes(field) ? (
              <Textarea
                defaultValue={value?.[field] ?? ""}
                name={`zh.${field}`}
              />
            ) : (
              <Input defaultValue={value?.[field] ?? ""} name={`zh.${field}`} />
            )}
          </Field>
        ))}
      </div>
    </details>
  );
}

/** Collects `zh.*` inputs into the JSON column's shape. */
export function readZh(formData: FormData) {
  const zh: Record<string, string> = {};
  for (const [name, value] of formData.entries()) {
    if (!name.startsWith("zh.")) continue;
    if (typeof value === "string" && value.trim()) zh[name.slice(3)] = value;
  }
  return Object.keys(zh).length ? zh : undefined;
}
