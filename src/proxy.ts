import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { decodeJWT } from "./auth/jwt";
import { DEFAULT_AUTH_REDIRECT, DEV_NEXT_PUBLIC_BASE_URL } from "./constants";
import { buildCsp } from "./csp";
import type { NextRequest } from "next/server";

const isProd = process.env.NODE_ENV === "production";
const minioDomain = process.env.MINIO_DOMAIN;

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/") {
    const headersList = await headers();
    const host = headersList.get("x-forwarded-host") || headersList.get("host");

    const mainHost = new URL(
      process.env.NEXT_PUBLIC_BASE_URL || DEV_NEXT_PUBLIC_BASE_URL,
    );

    if (host && host !== mainHost.host) {
      // Public map served via subdomain rewrite — allow embedding on any site
      const response = NextResponse.rewrite(
        new URL(`/public/${host}`, request.url),
      );
      response.headers.set(
        "Content-Security-Policy",
        buildCsp({ frameAncestors: "*", isProd, minioDomain }),
      );
      return response;
    }

    const jwt = await decodeJWT();
    // Redirect from / to dashboard (/maps at time of writing) if user is authenticated
    if (typeof jwt?.decoded === "object" && jwt?.decoded && jwt.decoded.id) {
      return NextResponse.redirect(new URL(DEFAULT_AUTH_REDIRECT, request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
  response.headers.set(
    "Content-Security-Policy",
    buildCsp({ frameAncestors: "'self'", isProd, minioDomain }),
  );
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo.svg, etc.
     * - ingest (PostHog proxy)
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|logo\\..*|ingest).*)",
  ],
};
