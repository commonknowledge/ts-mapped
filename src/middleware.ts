import { NextResponse } from "next/server";
import { decodeJWT } from "./auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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
