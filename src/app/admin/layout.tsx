import type { Metadata } from "next";
import { Archivo, Inter_Tight } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import en from "../../../messages/en.json";
import "../globals.css";

/**
 * The admin portal is its own root layout: it sits beside `[locale]` rather
 * than under it, because the portal has a single English-reading user and does
 * not need locale negotiation. Next.js allows multiple root layouts as long as
 * no layout exists above them — hence no `src/app/layout.tsx`.
 *
 * Shared components still call `useTranslations`, so the English messages are
 * provided statically here — `getRequestConfig` would 404 without a `[locale]`
 * root param.
 */

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

export const metadata: Metadata = {
  title: "Admin | Hercules Factory",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale="en" messages={en}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
