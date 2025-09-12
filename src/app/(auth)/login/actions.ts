"use server";

import { sign } from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect, unstable_rethrow as rethrow } from "next/navigation";
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

    if (result.error) return "Invalid credentials";
    const user = await findUserByEmailAndPassword(result.data);
    if (!user) return "Invalid credentials";

    const cookieStore = await cookies();
    cookieStore.set(
      "JWT",
      sign({ id: user.id }, process.env.JWT_SECRET || "", {
        expiresIn: 24 * 60 * 60,
      }),
    );

    redirect("/dashboard");
  } catch (error) {
    rethrow(error);
    logger.warn(`Failed to log in user`, { error });
    return "Failed to log in";
  }
}
