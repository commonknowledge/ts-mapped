import { TRPCError } from "@trpc/server";
import z from "zod";
import ensureOrganisationMap from "@/server/commands/ensureOrganisationMap";
import { passwordSchema, userSchema } from "@/server/models/User";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { upsertOrganisationUser } from "@/server/repositories/OrganisationUser";
import { listUsers, updateUser, upsertUser } from "@/server/repositories/User";
import logger from "@/server/services/logger";
import { verifyPassword } from "@/server/utils/auth";
import { protectedProcedure, router, superadminProcedure } from "../index";

export const userRouter = router({
  create: superadminProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        organisation: z.string().min(1),
        password: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const org = await upsertOrganisation({
          name: input.organisation,
        });
        const user = await upsertUser({
          email: input.email,
          name: input.name,
          password: input.password,
        });
        await upsertOrganisationUser({
          organisationId: org.id,
          userId: user.id,
        });
        await ensureOrganisationMap(org.id);
        logger.info(`Created user ${input.email}, ID ${user.id}`);
      } catch (error) {
        logger.error("Could not create user", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unknown error",
        });
      }
    }),
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
