import { TRPCError } from "@trpc/server";
import z from "zod";
import { passwordSchema, userSchema } from "@/server/models/User";
import { listUsers, updateUser } from "@/server/repositories/User";
import { verifyPassword } from "@/server/utils/auth";
import { protectedProcedure, router, superadminProcedure } from "../index";

export const userRouter = router({
  list: superadminProcedure.query(() => listUsers()),
  update: protectedProcedure
    .input(
      userSchema.pick({ email: true, name: true, avatarUrl: true }).partial(),
    )
    .mutation(async ({ input, ctx }) => {
      const user = await updateUser(ctx.user.id, input);
      return user;
    }),

  updatePassword: protectedProcedure
    .input(
      z
        .object({
          currentPassword: passwordSchema,
          newPassword: passwordSchema,
          newPasswordValidation: passwordSchema,
        })
        .refine((data) => data.newPassword === data.newPasswordValidation, {
          message: "Passwords do not match.",
          path: ["newPasswordValidation"],
        }),
    )
    .mutation(async ({ input, ctx }) => {
      const passwordValid = await verifyPassword(
        input.currentPassword,
        ctx.user.passwordHash,
      );
      if (!passwordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials.",
        });
      }
      const user = await updateUser(ctx.user.id, {
        newPassword: input.newPassword,
      });
      return user;
    }),
});
