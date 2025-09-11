import { TRPCError } from "@trpc/server";
import z from "zod";
import { userSchema } from "@/server/models/User";
import { updateUser } from "@/server/repositories/User";
import { verifyPassword } from "@/server/utils/auth";
import { protectedProcedure, router } from "../index";

export const userRouter = router({
  update: protectedProcedure
    .input(
      userSchema
        .pick({ email: true })
        .partial()
        .and(
          z.object({
            currentPassword: z.string(),
            newPassword: z.string().optional(),
          }),
        ),
    )
    .mutation(async ({ input, ctx }) => {
      if (!verifyPassword(input.currentPassword, ctx.user.passwordHash)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials.",
        });
      }
      const user = await updateUser(ctx.user.id, input);
      return user;
    }),
});
