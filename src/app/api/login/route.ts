import { type NextRequest, NextResponse } from "next/server";
import z from "zod";
import { setJWT } from "@/auth/jwt";
import { findUserByEmailAndPassword } from "@/server/repositories/User";
import logger from "@/server/services/logger";
import {
  checkLoginAttempt,
  getClientIp,
  rollbackLoginAttempt,
} from "@/server/utils/ratelimit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  logger.info(`Login request from ${ip}`);

  const allowed = await checkLoginAttempt(ip);
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
      await rollbackLoginAttempt(ip);
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

    await rollbackLoginAttempt(ip);
    await setJWT(user.id, user.email);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.warn(`Failed to log in user`, { error });
    await rollbackLoginAttempt(ip);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}
