import Image from "next/image";

/**
 * Ft5 statement footer — the statement itself now lives in the closing CTA band
 * on the page, so this is the mast row that closes it out on the same dark base.
 */
export function PublicFooter({
  social,
}: {
  social: { id: string; label: string; url: string }[];
}) {
  return (
    <footer className="on-dark bg-paper px-4 pb-14 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 border-t border-hairline pt-8">
        <div className="flex items-center gap-2.5">
          <Image
            alt="Hercules Factory logo"
            className="size-9 rounded"
            height={36}
            src="/logo.png"
            width={36}
          />
          <span className="font-display text-sm font-black uppercase tracking-[0.18em]">
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
    </footer>
  );
}
