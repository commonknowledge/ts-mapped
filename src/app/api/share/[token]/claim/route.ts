import { NextResponse } from "next/server";
import { addShareGrant } from "@/auth/shareGrants";
import { findMapShareByToken } from "@/server/repositories/MapShare";
import type { NextRequest } from "next/server";

/**
 * Mints the grant cookie for a passwordless share. Called by the share
 * page's `ShareClaim` component (Next.js forbids setting cookies during
 * page render); the client then refreshes so the server component sees
 * the grant. Password-protected shares are never minted here — the page
 * shows the password form, and the verify endpoint mints instead.
 */
export async function POST(
  _request: NextRequest,
  args: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await args.params;
  const share = await findMapShareByToken(token);
  if (!share || !share.enabled) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (share.passwordHash) {
    return new NextResponse("Password required", { status: 401 });
  }

  await addShareGrant({ shareId: share.id, mapId: share.mapId });
  return new NextResponse(null, { status: 204 });
}
