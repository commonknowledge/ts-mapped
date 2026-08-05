import { NextResponse } from "next/server";
import { addShareGrant } from "@/auth/shareGrants";
import { findMapShareByToken } from "@/server/repositories/MapShare";
import type { NextRequest } from "next/server";

/**
 * Mints the grant cookie for a passwordless share and bounces back to the
 * share page. Exists because Next.js forbids setting cookies during page
 * render. Password-protected shares are never minted here — the page shows
 * the password form, and the verify endpoint mints instead.
 */
export async function GET(
  request: NextRequest,
  args: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await args.params;
  const share = await findMapShareByToken(token);

  const shareUrl = new URL(`/share/${token}`, request.nextUrl.origin);
  const viewId = request.nextUrl.searchParams.get("viewId");
  if (viewId) {
    shareUrl.searchParams.set("viewId", viewId);
  }

  if (share && share.enabled && !share.passwordHash) {
    await addShareGrant({ shareId: share.id, mapId: share.mapId });
    // Marks the claim as attempted so the page can detect blocked cookies
    // instead of redirecting here again
    shareUrl.searchParams.set("c", "1");
  }

  return NextResponse.redirect(shareUrl);
}
