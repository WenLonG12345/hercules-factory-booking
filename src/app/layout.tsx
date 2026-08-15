import type { Metadata } from "next";
import { Archivo, Inter_Tight } from "next/font/google";
import "./globals.css";

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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Hercules Factory | Muay Thai Classes in Malaysia",
    template: "%s | Hercules Factory",
  },
  description:
    "Muay Thai for everyone in Malaysia — beginners, fitness, and fighters. Group classes, kids classes, and personal training. Book on WhatsApp.",
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
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Hercules Factory Muay Thai",
    description:
      "Muay Thai for everyone. Beginners. Fitness. Fighters. Book a class on WhatsApp.",
    url: "/",
    siteName: "Hercules Factory",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Hercules Factory logo",
      },
    ],
    locale: "en_MY",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hercules Factory Muay Thai",
    description: "Muay Thai for everyone. Beginners. Fitness. Fighters.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
