import {
  ArrowRight,
  CalendarDays,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
} from "lucide-react";
import Link from "next/link";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { ButtonLink } from "@/components/ui/button";
import { formatCurrency, whatsappLink } from "@/lib/utils";
import { getLandingData, getPackages } from "@/server/services/queries";

export default async function Home() {
  const [{ content, gallery, coaches, testimonials, socialLinks }, packages] =
    await Promise.all([getLandingData(), getPackages()]);

  const whatsappSocialLink = socialLinks.find(
    (link) => link.platform.toLowerCase() === "whatsapp",
  );
  const whatsappHref = whatsappSocialLink
    ? whatsappSocialLink.url.startsWith("http")
      ? whatsappSocialLink.url
      : whatsappLink(
          whatsappSocialLink.url,
          "Hi Hercules Factory, I want to book a Muay Thai class.",
        )
    : null;

  const hasCtas = content?.primaryCtaText || content?.secondaryCtaText;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <PublicHeader />

      <main>
        <section className="relative isolate overflow-hidden pt-24">
          <img
            alt="Muay Thai fighter wrapping hands"
            className="absolute inset-0 -z-20 h-full w-full object-cover opacity-42"
            src="https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?auto=format&fit=crop&w=1800&q=80"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(15,12,10,0.96),rgba(15,12,10,0.72),rgba(127,29,29,0.42))]" />
          <div className="mx-auto grid min-h-190 max-w-7xl content-center gap-12 px-4 pb-20 md:grid-cols-[1.15fr_0.85fr] md:px-8">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded bg-red-700 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-white">
                <ShieldCheck className="size-4" />
                Monday to Saturday
              </p>
              {content?.heroTitle && (
                <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-stone-50 md:text-7xl">
                  {content.heroTitle}
                </h1>
              )}
              {content?.heroSubtitle && (
                <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-200 md:text-xl">
                  {content.heroSubtitle}
                </p>
              )}
              {hasCtas && (
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  {content?.primaryCtaText && (
                    <ButtonLink href="/member/login">
                      {content.primaryCtaText}
                      <ArrowRight className="size-4" />
                    </ButtonLink>
                  )}
                  {content?.secondaryCtaText && whatsappHref && (
                    <ButtonLink
                      href={whatsappHref}
                      target="_blank"
                      variant="secondary"
                    >
                      <MessageCircle className="size-4" />
                      {content.secondaryCtaText}
                    </ButtonLink>
                  )}
                </div>
              )}
            </div>
            <div className="self-end border-l border-amber-300/40 pl-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">
                Class Slots
              </p>
              <div className="mt-5 grid gap-3">
                {["7:00 PM - 8:30 PM", "8:30 PM - 10:00 PM"].map((slot) => (
                  <div
                    className="rounded-lg border border-white/10 bg-black/35 p-5"
                    key={slot}
                  >
                    <p className="text-2xl font-black">{slot}</p>
                    <p className="mt-1 text-sm text-stone-300">
                      Muay Thai fundamentals, pads, bag work, and conditioning.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {(content?.aboutTitle || content?.aboutBody) && (
          <section id="about" className="bg-stone-100 py-20 text-stone-950">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-[0.75fr_1.25fr] md:px-8">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-red-700">
                  About
                </p>
                {content.aboutTitle && (
                  <h2 className="mt-3 text-4xl font-black tracking-tight">
                    {content.aboutTitle}
                  </h2>
                )}
              </div>
              {content?.aboutBody && (
                <p className="text-xl leading-9 text-stone-700">
                  {content.aboutBody}
                </p>
              )}
            </div>
          </section>
        )}

        {packages.length > 0 && (
          <section id="pricing" className="bg-stone-950 py-20">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-300">
                Pricing
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight">
                Simple packages for every rhythm.
              </h2>
              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {packages.map((pkg) => (
                  <div
                    className="rounded-lg border border-white/10 bg-white/[0.04] p-6"
                    key={pkg.id}
                  >
                    <p className="text-lg font-black">{pkg.name}</p>
                    <p className="mt-4 text-4xl font-black text-amber-300">
                      {formatCurrency(pkg.priceCents)}
                    </p>
                    <p className="mt-4 text-sm leading-6 text-stone-300">
                      {pkg.type === "single" && "Pay per drop-in class."}
                      {pkg.type === "ten_class" &&
                        "10 class credits, valid for 1 month."}
                      {pkg.type === "unlimited" &&
                        "Unlimited classes for 1 month."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="schedule" className="bg-red-950 py-16">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between md:px-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-300">
                Schedule
              </p>
              <h2 className="mt-2 text-4xl font-black">Monday to Saturday</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                className="rounded-lg bg-stone-50 px-5 py-4 font-black text-stone-950"
                href="/schedule"
              >
                <CalendarDays className="mb-2 size-5 text-red-700" />
                View schedule
              </Link>
              <Link
                className="rounded-lg bg-amber-300 px-5 py-4 font-black text-stone-950"
                href="/member/login"
              >
                <ArrowRight className="mb-2 size-5" />
                Reserve a slot
              </Link>
            </div>
          </div>
        </section>

        {gallery.length > 0 && (
          <section className="bg-stone-100 py-20 text-stone-950">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
              <div className="grid gap-4 md:grid-cols-3">
                {gallery.map((image) => (
                  <figure className="overflow-hidden rounded-lg" key={image.id}>
                    <img
                      alt={image.alt}
                      className="h-80 w-full object-cover"
                      src={image.imageUrl}
                    />
                    {image.caption && (
                      <figcaption className="bg-stone-950 px-4 py-3 text-sm font-semibold text-stone-100">
                        {image.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {coaches.length > 0 && (
          <section id="coaches" className="bg-stone-950 py-20">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
              <h2 className="text-4xl font-black tracking-tight">Coaches</h2>
              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {coaches.map((coach) => (
                  <article
                    className="grid gap-5 rounded-lg border border-white/10 bg-white/[0.04] p-5 sm:grid-cols-[180px_1fr]"
                    key={coach.id}
                  >
                    {coach.imageUrl && (
                      <img
                        alt={coach.name}
                        className="h-48 w-full rounded-md object-cover sm:h-full"
                        src={coach.imageUrl}
                      />
                    )}
                    <div>
                      <p className="text-2xl font-black">{coach.name}</p>
                      <p className="mt-1 text-amber-300">{coach.title}</p>
                      <p className="mt-4 leading-7 text-stone-300">
                        {coach.bio}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {testimonials.length > 0 && (
          <section className="bg-stone-100 py-20 text-stone-950">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
              <h2 className="text-4xl font-black tracking-tight">
                What members say
              </h2>
              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {testimonials.map((testimonial) => (
                  <figure
                    className="rounded-lg border border-stone-200 bg-white p-6"
                    key={testimonial.id}
                  >
                    <div className="mb-4 flex gap-1 text-amber-500">
                      {Array.from(
                        { length: testimonial.rating },
                        (_, star) => star + 1,
                      ).map((star) => (
                        <Star
                          className="size-4 fill-current"
                          key={`${testimonial.id}-${star}`}
                        />
                      ))}
                    </div>
                    <blockquote className="text-xl font-semibold leading-8">
                      "{testimonial.quote}"
                    </blockquote>
                    <figcaption className="mt-5 text-sm font-black text-red-700">
                      {testimonial.customerName}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {(content?.locationTitle || content?.locationAddress) && (
          <section className="bg-stone-950 py-16">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-[0.8fr_1.2fr] md:px-8">
              <div>
                <MapPin className="mb-4 size-8 text-red-500" />
                {content.locationTitle && (
                  <h2 className="text-4xl font-black">
                    {content.locationTitle}
                  </h2>
                )}
                {content.locationAddress && (
                  <p className="mt-4 text-stone-300">
                    {content.locationAddress}
                  </p>
                )}
              </div>
              {(content.mapEmbedUrl || content.locationAddress) && (
                <div className="grid min-h-72 place-items-center rounded-lg border border-white/10 bg-stone-900">
                  <iframe
                    src={
                      content.mapEmbedUrl ||
                      `https://www.google.com/maps?q=${encodeURIComponent(content.locationAddress ?? "")}&output=embed`
                    }
                    className="h-100 w-full rounded-md border-0"
                    loading="lazy"
                    title="Location"
                  />
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
