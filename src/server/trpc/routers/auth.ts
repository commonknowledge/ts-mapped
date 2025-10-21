import { SignJWT } from "jose";
import { cookies } from "next/headers";
import z from "zod";
import ForgotPassword from "@/server/emails/forgot-password";
import {
  findUserByEmail,
  findUserByToken,
  updateUser,
} from "@/server/repositories/User";
import { sendEmail } from "@/server/services/mailer";
import { publicProcedure, router } from "../index";

export const authRouter = router({
  confirmInvite: publicProcedure
    .input(z.object({ token: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      const { password, token } = input;
      const user = await findUserByToken(token);
      if (!user) return false;
      await updateUser(user.id, { newPassword: password });

      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
      const cookieToken = await new SignJWT({ id: user.id, email: user.email })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("24h")
        .sign(secret);

      const cookieStore = await cookies();
      cookieStore.set("JWT", cookieToken);
      return user;
    }),
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string() }))
    .mutation(async ({ input }) => {
      const { email } = input;
      const user = await findUserByEmail(email);
      if (!user) return true;

      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
      const token = await new SignJWT({ id: user.id })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("15m")
        .sign(secret);

      await sendEmail(email, "Reset your password", ForgotPassword({ token }));
      return true;
    }),
  resetPassword: publicProcedure
    .input(z.object({ token: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      const { token, password } = input;
      const user = await findUserByToken(token);
      if (!user) return false;
      return await updateUser(user.id, { newPassword: password });
    }),
});
