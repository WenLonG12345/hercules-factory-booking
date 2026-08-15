"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

export function FaqAccordion({
  items,
}: {
  items: { id: string; question: string; answer: string }[];
}) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <ul className="border-t border-hairline">
      {items.map((item, index) => {
        const open = openId === item.id;
        return (
          <li
            key={item.id}
            className="border-b border-hairline"
            data-reveal
            style={{ "--i": index } as React.CSSProperties}
          >
            <button
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-6 py-6 text-left"
              onClick={() => setOpenId(open ? null : item.id)}
              type="button"
            >
              <span className="font-display text-(--text-h3) font-bold uppercase tracking-tight">
                {item.question}
              </span>
              <Plus
                className={`size-5 shrink-0 text-accent transition-transform duration-300 ${
                  open ? "rotate-45" : ""
                }`}
              />
            </button>
            <div className="accordion-panel" data-open={open}>
              <div>
                <p className="pb-6 text-ink-dim">{item.answer}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
