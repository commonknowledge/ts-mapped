import { NextResponse } from "next/server";
import { addShareGrant } from "@/auth/shareGrants";
import { findMapShareByToken } from "@/server/repositories/MapShare";
import {
  checkSharePasswordAttempt,
  getClientIp,
} from "@/server/services/ratelimit";
import { verifyPassword } from "@/server/utils/auth";
import type { NextRequest } from "next/server";

/**
 * Verifies a shared map's password and mints the grant cookie on success.
 * Rate-limited per IP + token to resist password guessing.
 */
export async function POST(
  request: NextRequest,
  args: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await args.params;
  const share = await findMapShareByToken(token);
  if (!share || !share.enabled) {
    return new NextResponse("Not found", { status: 404 });
  }

  // If the password was removed while the form was open, the claim is free
  if (!share.passwordHash) {
    await addShareGrant({ shareId: share.id, mapId: share.mapId });
    return new NextResponse(null, { status: 204 });
  }

  const ip = getClientIp(request);
  const allowed = await checkSharePasswordAttempt(ip, token);
  if (!allowed) {
    return new NextResponse("Too many attempts", { status: 429 });
  }

  let password = "";
  try {
    const body: unknown = await request.json();
    if (
      body !== null &&
      typeof body === "object" &&
      "password" in body &&
      typeof body.password === "string"
    ) {
      password = body.password;
    }
  } catch {
    // Malformed body: treated as an empty password below
  }

  const valid = password
    ? await verifyPassword(password, share.passwordHash)
    : false;
  if (!valid) {
    return new NextResponse("Incorrect password", { status: 401 });
  }

  await addShareGrant({ shareId: share.id, mapId: share.mapId });
  return new NextResponse(null, { status: 204 });
}
