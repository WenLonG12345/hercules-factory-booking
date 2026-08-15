import type { Metadata } from "next";
import { Archivo, Inter_Tight } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import "../globals.css";

const display = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display-face",
  display: "swap",
});

const body = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    ),
    title: {
      default: t("title"),
      template: "%s | Hercules Factory",
    },
    description: t("description"),
    applicationName: "Hercules Factory",
    authors: [{ name: "Hercules Factory" }],
    creator: "Hercules Factory",
    publisher: "Hercules Factory",
    keywords: [
      "Hercules Factory",
      "Muay Thai Malaysia",
      "Muay Thai gym",
      "Muay Thai classes",
      "kickboxing",
      "martial arts training",
      "Muay Thai booking",
      "泰拳",
      "吉隆坡泰拳",
    ],
    alternates: {
      canonical: locale === routing.defaultLocale ? "/" : `/${locale}`,
      languages: { en: "/", zh: "/zh" },
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      url: locale === routing.defaultLocale ? "/" : `/${locale}`,
      siteName: "Hercules Factory",
      images: [
        {
          url: "/logo.png",
          width: 512,
          height: 512,
          alt: "Hercules Factory logo",
        },
      ],
      locale: locale === "zh" ? "zh_MY" : "en_MY",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: ["/logo.png"],
    },
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png" }],
    },
    manifest: "/site.webmanifest",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  // An unknown locale is rejected in `src/i18n/request.ts`, which reads the
  // same root param.
  const { locale } = await params;

  return (
    <html
      lang={locale}
      className={`${display.variable} ${body.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
