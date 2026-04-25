import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Hercules Factory | Muay Thai Classes in Malaysia",
    template: "%s | Hercules Factory",
  },
  description:
    "Book Muay Thai classes at Hercules Factory. Train Monday to Saturday with structured coaching, flexible packages, and WhatsApp booking.",
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
      "Book Muay Thai classes at Hercules Factory. Single classes, 10-class packages, and unlimited monthly training.",
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
    description:
      "Book Muay Thai classes at Hercules Factory. Train Monday to Saturday.",
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
      className="h-full antialiased"
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
