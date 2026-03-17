import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import z from "zod";
import { findUserByEmailAndPassword } from "@/server/repositories/User";
import logger from "@/server/services/logger";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
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
    cookieStore.set("JWT", token);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.warn(`Failed to log in user`, { error });
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}
