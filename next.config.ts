import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // Server-action bodies are capped at 1MB by default, but a phone or tablet
    // camera photo is 3–8MB — uploads were rejected before the action ever ran,
    // surfacing to the admin as the redacted "Minified React error #441". The
    // 1MB over our own 8MB file cap covers the multipart boundaries and field
    // metadata that ride along with the file.
    serverActions: { bodySizeLimit: "9mb" },
  },
  images: {
    remotePatterns: [
      // Seed/demo placeholders until real gym photography is uploaded.
      { protocol: "https" as const, hostname: "images.unsplash.com" },
      ...(process.env.R2_PUBLIC_BASE_URL
        ? [
            {
              protocol: "https" as const,
              hostname: new URL(process.env.R2_PUBLIC_BASE_URL).hostname,
            },
          ]
        : []),
    ],
  },
};

export default withNextIntl(nextConfig);
