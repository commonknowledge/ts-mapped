import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import z from "zod";
import { findUserByEmailAndPassword } from "@/server/repositories/User";
import logger from "@/server/services/logger";
import { checkLoginRateLimit } from "@/server/utils/ratelimit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    (forwarded ? forwarded.split(",")[0].trim() : null) ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const allowed = await checkLoginRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many login attempts, please try again later" },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (result.error) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 400 },
      );
    }

    const user = await findUserByEmailAndPassword(result.data);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    const token = await new SignJWT({ id: user.id, email: user.email })
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

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.warn(`Failed to log in user`, { error });
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}
