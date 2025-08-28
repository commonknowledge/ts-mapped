import { TRPCError } from "@trpc/server";
import { sign } from "jsonwebtoken";
import { cookies } from "next/headers";
import z from "zod";
import ForgotPassword from "@/server/emails/forgot-password";
import {
  findUserByEmail,
  findUserByEmailAndPassword,
  findUserByToken,
  updateUser,
} from "@/server/repositories/User";
import { sendEmail } from "@/server/services/mailer";
import { publicProcedure, router } from "../index";

export const authRouter = router({
  login: publicProcedure
    .input(z.object({ email: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      const user = await findUserByEmailAndPassword(input);

      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const cookieStore = await cookies();
      cookieStore.set(
        "JWT",
        sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "", {
          expiresIn: 24 * 60 * 60,
        }),
      );
    }),
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string() }))
    .mutation(async ({ input }) => {
      const { email } = input;
      const user = await findUserByEmail(email);
      if (!user) return true;
      const token = sign({ id: user.id }, process.env.JWT_SECRET || "", {
        expiresIn: "15minutes",
      });
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
