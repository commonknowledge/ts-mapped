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
    // sanity-cdn.com: Sanity visual-editing bridge (core.sanity-cdn.com/bridge.js)
    // plus module-federation code loaded from the bare host (sanity-cdn.com/v1/modules/…),
    // used by the embedded Studio (/studio) and next-sanity live/preview
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://sanity-cdn.com https://*.sanity-cdn.com",
    "style-src 'self' 'unsafe-inline'",
    // next/font/google self-hosts fonts — no external font CDN needed
    "font-src 'self'",
    // Images are passive (no script/DOM/cookie access); allow any HTTPS host so
    // public-map editors can use arbitrary image URLs (e.g. the "Image URL"
    // column). data:/blob: remain for inline + Mapbox-generated images.
    "img-src 'self' data: blob: https:",
    [
      // PostHog proxied via /ingest/*, Sentry proxied via /monitoring — both hit 'self'
      // Mapbox tiles + events, Postcodes.io, Google Sheets/OAuth, MinIO, Mux, Google Cast, Zetkin
      // Sanity: api/apicdn for content + Studio auth, wss for live listeners,
      // sanity-cdn.com (bare + subdomains) for the visual-editing bridge and
      // the Studio's module-federation code
      [
        "connect-src 'self' data: https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com https://api.postcodes.io https://sheets.googleapis.com https://oauth2.googleapis.com https://*.mux.com https://inferred.litix.io https://www.gstatic.com https://cast.google.com https://api.zetk.in https://api.sanity.io https://*.api.sanity.io https://*.apicdn.sanity.io wss://*.api.sanity.io https://sanity-cdn.com https://*.sanity-cdn.com",
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
    // Mapbox GL uses blob: workers and iframes
    "worker-src blob:",
    "child-src blob:",
    `frame-ancestors ${frameAncestors}`,
  ].join("; ");
}
