import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getJwtSecret } from "./jwtSecret";

// Cap the cookie size; adding a grant beyond the cap drops the oldest
const MAX_GRANTS = 10;

/**
 * Read and verify a signed cookie of visitor grants. Returns [] for
 * missing, invalid or expired cookies. Grants returned here are only
 * *candidates*: callers must validate them against the live database row.
 */
export async function getGrantsCookie<T>(name: string): Promise<T[]> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(name);
  if (!cookie?.value) {
    return [];
  }
  try {
    const { payload } = await jwtVerify<{ grants: T[] }>(
      cookie.value,
      getJwtSecret(),
    );
    return Array.isArray(payload.grants) ? payload.grants : [];
  } catch {
    // Don't bother logging invalid JWTs
    return [];
  }
}

/**
 * Add a grant to a signed cookie of visitor grants, dropping any existing
 * grant it `replaces`. Must be called from a route handler or server
 * action: Next.js forbids setting cookies during server component render.
 */
export async function addToGrantsCookie<T>({
  name,
  grant,
  replaces,
  lifetimeSeconds,
  cookieOptions,
}: {
  name: string;
  grant: T;
  replaces: (existing: T) => boolean;
  lifetimeSeconds: number;
  cookieOptions: {
    sameSite: "lax" | "none";
    partitioned?: boolean;
    maxAge?: number;
  };
}): Promise<void> {
  const existing = await getGrantsCookie<T>(name);
  const grants = [grant, ...existing.filter((other) => !replaces(other))].slice(
    0,
    MAX_GRANTS,
  );

  const nowSeconds = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({ grants })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(nowSeconds + lifetimeSeconds)
    .sign(getJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set(name, token, {
    httpOnly: true,
    secure: true,
    path: "/",
    ...cookieOptions,
  });
}
