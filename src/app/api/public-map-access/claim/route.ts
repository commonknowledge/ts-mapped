import { NextResponse } from "next/server";
import { addPublicMapAccessGrant } from "@/auth/publicMapAccessGrants";
import { findClaimablePublicMapAccess } from "@/server/services/publicMapAccess";
import type { NextRequest } from "next/server";

/**
 * Exchanges a moderated public map's magic link token for the access grant
 * cookie. Called by the access gate from inside the map's iframe, so the
 * (partitioned) cookie lands under the embedding site. The client then
 * refreshes so the server component sees the grant.
 *
 * The link is not used up: the same link works on another device until it
 * expires, even after newer links have been issued.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let token = "";
  try {
    const body: unknown = await request.json();
    if (
      body !== null &&
      typeof body === "object" &&
      "token" in body &&
      typeof body.token === "string"
    ) {
      token = body.token;
    }
  } catch {
    // Malformed body: treated as a missing token below
  }

  const access = token ? await findClaimablePublicMapAccess(token) : null;
  if (!access) {
    return new NextResponse("Link invalid or expired", { status: 404 });
  }

  await addPublicMapAccessGrant({
    accessId: access.id,
    publicMapId: access.publicMapId,
  });
  return new NextResponse(null, { status: 204 });
}
