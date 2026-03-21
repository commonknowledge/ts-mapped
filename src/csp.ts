export function buildCsp({
  frameAncestors,
  isProd,
  minioDomain,
}: {
  frameAncestors: string;
  isProd: boolean;
  minioDomain?: string;
}): string {
  return [
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
      // Mapbox tiles + events, Postcodes.io, Google Sheets/OAuth, MinIO, Mux, Google Cast
      [
        "connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com https://api.postcodes.io https://sheets.googleapis.com https://oauth2.googleapis.com https://*.mux.com https://inferred.litix.io https://www.gstatic.com https://cast.google.com",
        // Next.js HMR uses WebSockets in dev
        !isProd ? "ws://localhost:* wss://localhost:*" : null,
      ]
        .filter(Boolean)
        .join(" "),
      minioDomain ? `https://${minioDomain}` : null,
    ]
      .filter(Boolean)
      .join(" "),
    "frame-src https://www.youtube.com https://youtube.com",
    "media-src blob: https://*.mux.com",
    // Mapbox GL uses blob: workers
    "worker-src blob:",
    `frame-ancestors ${frameAncestors}`,
  ].join("; ");
}
