import { NextResponse } from "next/server";
import { addPublicMapAccessGrant } from "@/auth/publicMapAccessGrants";
import { addShareGrant } from "@/auth/shareGrants";
import { findMapShareById } from "@/server/repositories/MapShare";
import { findClaimableMapAccess } from "@/server/services/mapAccess";
import type { NextRequest } from "next/server";

/**
 * Exchanges a magic link token for the access grant cookie, then the client
 * refreshes so the server component sees the grant. Called by the access
 * gate of either:
 * - a moderated public map, from inside the map's iframe, so the
 *   (partitioned) cookie lands under the embedding site, or
 * - a shared map, at its Mapped address.
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

  const access = token ? await findClaimableMapAccess(token) : null;
  if (!access) {
    return new NextResponse("Link invalid or expired", { status: 404 });
  }

  if (access.publicMapId) {
    await addPublicMapAccessGrant({
      accessId: access.id,
      publicMapId: access.publicMapId,
    });
    return new NextResponse(null, { status: 204 });
  }

  const share = access.mapShareId
    ? await findMapShareById(access.mapShareId)
    : null;
  if (!share?.enabled) {
    return new NextResponse("Link invalid or expired", { status: 404 });
  }
  await addShareGrant({ accessId: access.id, mapId: share.mapId });
  return new NextResponse(null, { status: 204 });
}
