import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { decodeJWT } from "./auth/jwt";
import { DEV_NEXT_PUBLIC_BASE_URL } from "./constants";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/") {
    const headersList = await headers();
    const host = headersList.get("x-forwarded-host") || headersList.get("host");

    const mainHost = new URL(
      process.env.NEXT_PUBLIC_BASE_URL || DEV_NEXT_PUBLIC_BASE_URL,
    );

    if (host && host !== mainHost.host) {
      return NextResponse.rewrite(new URL(`/public/${host}`, request.url));
    }

    const jwt = await decodeJWT();
    // Redirect to dashboard if user is authenticated
    if (typeof jwt?.decoded === "object" && jwt?.decoded && jwt.decoded.id) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
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
