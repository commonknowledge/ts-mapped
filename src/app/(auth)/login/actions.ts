"use server";

import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { unstable_rethrow as rethrow } from "next/navigation";
import z from "zod";
import { findUserByEmailAndPassword } from "@/server/repositories/User";
import logger from "@/server/services/logger";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function login(formData: FormData) {
  try {
    const result = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (result.error) {
      return "Invalid credentials";
    }
    const user = await findUserByEmailAndPassword(result.data);
    if (!user) {
      return "Invalid credentials";
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    const token = await new SignJWT({ id: user.id, email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(secret);

    const cookieStore = await cookies();
    cookieStore.set("JWT", token);

    return "";
  } catch (error) {
    rethrow(error);
    logger.warn(`Failed to log in user`, { error });
    return "Failed to log in";
  }
}
