import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export async function decodeJWT() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("JWT");
  if (!authCookie || !authCookie.value) {
    return null;
  }
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    const { payload } = await jwtVerify<{ id: string }>(
      authCookie.value,
      secret,
    );
    return { encoded: authCookie.value, decoded: payload };
  } catch {
    // Don't bother logging invalid JWTs
    return null;
  }
}
