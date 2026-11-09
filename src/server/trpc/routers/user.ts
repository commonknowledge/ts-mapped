import { TRPCError } from "@trpc/server";
import z from "zod";
import { UserRole, passwordSchema, userSchema } from "@/models/User";
import {
  clearUserTrial,
  deleteUser,
  findUserById,
  listUsers,
  updateUser,
  updateUserRole,
} from "@/server/repositories/User";
import { verifyPassword } from "@/server/utils/auth";
import { protectedProcedure, router, superadminProcedure } from "../index";

export const userRouter = router({
  list: superadminProcedure.query(() => listUsers()),
  clearTrial: superadminProcedure
    .input(z.object({ userId: z.uuid() }))
    .mutation(async ({ input }) => {
      return clearUserTrial(input.userId);
    }),
  delete: superadminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot delete yourself",
        });
      }
      const user = await findUserById(input.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      await deleteUser(input.userId);
    }),
  updateRole: superadminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(UserRole).nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      return updateUserRole(input.userId, input.role);
    }),
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
          code: "FORBIDDEN",
          message: "Invalid credentials.",
        });
      }
      const user = await updateUser(ctx.user.id, {
        newPassword: input.newPassword,
      });
      return user;
    }),
});
