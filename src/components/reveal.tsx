"use client";

import { useEffect, useRef } from "react";

/**
 * reveal-stagger. Sets data-reveal="in" on children the first time they scroll
 * into view; the transition itself lives in globals.css. No animation library.
 */
export function Reveal({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "ul" | "header";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const targets = root.hasAttribute("data-reveal")
      ? [root]
      : Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-reveal", "in");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );

    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    // `as never` keeps the polymorphic ref assignable without widening to any.
    <Tag className={className} ref={ref as never}>
      {children}
    </Tag>
  );
}
