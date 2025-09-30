import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { decodeJWT } from "./auth/jwt";
import { DEV_NEXT_PUBLIC_BASE_URL } from "./constants";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host");

  const mainHost = new URL(
    process.env.NEXT_PUBLIC_BASE_URL || DEV_NEXT_PUBLIC_BASE_URL,
  );

  if (host && host !== mainHost.host) {
    // Special "public" value for [id] to mark this view as public
    return NextResponse.rewrite(
      new URL(`/map/public/view/${host}/publish`, request.url),
    );
  }

  const jwt = await decodeJWT();
  // Redirect to dashboard if user is authenticated
  if (typeof jwt?.decoded === "object" && jwt?.decoded && jwt.decoded.id) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
