import { withSentryConfig } from "@sentry/nextjs";
import { DEV_NEXT_PUBLIC_BASE_URL } from "./src/constants";
import type { NextConfig } from "next";

const mainHost = new URL(
  process.env.NEXT_PUBLIC_BASE_URL || DEV_NEXT_PUBLIC_BASE_URL,
);

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.ngrok-free.app"],
  experimental: {
    serverActions: {
      allowedOrigins: [mainHost.host],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
      ...["localhost", process.env.MINIO_DOMAIN]
        .filter((d) => d !== undefined)
        .map((d) => ({
          protocol: "https" as const,
          hostname: d,
          pathname: "/**",
        })),
    ],
  },
  // Packages that can't be bundled in the NextJS build
  serverExternalPackages: ["@whatwg-node", "@ngrok/ngrok"],
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    const minioDomain = process.env.MINIO_DOMAIN;

    const cspDirectives = [
      "default-src 'self'",
      // unsafe-inline required by Next.js hydration; unsafe-eval by some deps
      // gstatic.com: Google Cast SDK loaded by Mux player for Chromecast support
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline'",
      // next/font/google self-hosts fonts — no external font CDN needed
      "font-src 'self'",
      [
        "img-src 'self' data: blob: https://cdn.sanity.io https://image.mux.com",
        minioDomain ? `https://${minioDomain}` : null,
      ]
        .filter(Boolean)
        .join(" "),
      [
        // PostHog proxied via /ingest/*, Sentry proxied via /monitoring — both hit 'self'
        // Mapbox tiles + events, Postcodes.io, Google Sheets/OAuth, MinIO
        "connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com https://api.postcodes.io https://sheets.googleapis.com https://oauth2.googleapis.com https://*.mux.com https://inferred.litix.io https://www.gstatic.com https://cast.google.com",
        minioDomain ? `https://${minioDomain}` : null,
      ]
        .filter(Boolean)
        .join(" "),
      "frame-src https://www.youtube.com https://youtube.com",
      "media-src blob: https://*.mux.com",
      // Mapbox GL uses blob: workers
      "worker-src blob:",
      // Maps are embeddable on third-party sites
      "frame-ancestors *",
    ];

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Only set HSTS in production — localhost doesn't need it and browsers
          // don't enforce HSTS on localhost anyway, but this keeps it explicit
          ...(isProd
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains",
                },
              ]
            : []),
          {
            key: "Content-Security-Policy",
            value: cspDirectives.join("; "),
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "commonknowledge",

  project: "typescript-mapped",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",
});
