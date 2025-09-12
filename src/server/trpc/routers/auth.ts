import { SignJWT } from "jose";
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
      await updateUser(user.id, { password });
      return true;
    }),
});
