import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export async function setJWT(id: string, email: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
  const token = await new SignJWT({ id, email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(secret);
  const cookieStore = await cookies();
  cookieStore.set("JWT", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  cookieStore.delete("LoggedOut");
}

export async function decodeJWT() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("JWT");
  if (!authCookie || !authCookie.value) {
    return null;
  }
  // Belt-and-bracers check in case the server-side logout route failed
  const loggedOut = cookieStore.get("LoggedOut");
  if (loggedOut) {
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
