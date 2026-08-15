import Image from "next/image";

/** Ft5 statement footer. */
export function PublicFooter({
  social,
}: {
  social: { id: string; label: string; url: string }[];
}) {
  return (
    <footer className="border-t border-hairline px-4 py-16 md:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="font-display text-(--text-h2) font-black uppercase leading-[0.95] tracking-tight">
          Train hard.
          <br />
          <span className="text-accent">Everyone starts</span> somewhere.
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-hairline pt-6">
          <div className="flex items-center gap-2.5">
            <Image
              alt="Hercules Factory logo"
              className="size-8 rounded"
              height={32}
              src="/logo.png"
              width={32}
            />
            <span className="text-sm font-black uppercase tracking-[0.18em]">
              Hercules Factory
            </span>
          </div>

          <nav className="flex flex-wrap items-center gap-6 text-xs font-semibold uppercase tracking-[0.18em] text-ink-dim">
            {social.map((link) => (
              <a
                key={link.id}
                className="transition hover:text-accent-2"
                href={link.url}
                rel="noreferrer"
                target="_blank"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <p className="text-xs text-ink-dim">
            © {new Date().getFullYear()} Hercules Factory
          </p>
        </div>
      </div>
    </footer>
  );
}
