import { TRPCError } from "@trpc/server";
import { SignJWT } from "jose";
import z from "zod";
import ensureOrganisationMap from "@/server/commands/ensureOrganisationMap";
import Invite from "@/server/emails/invite";
import { passwordSchema, userSchema } from "@/server/models/User";
import {
  createInvitation,
  listPendingInvitations,
} from "@/server/repositories/Invitation";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { listUsers, updateUser } from "@/server/repositories/User";
import logger from "@/server/services/logger";
import { sendEmail } from "@/server/services/mailer";
import { verifyPassword } from "@/server/utils/auth";
import { protectedProcedure, router, superadminProcedure } from "../index";

export const userRouter = router({
  create: superadminProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        organisation: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const org = await upsertOrganisation({
          name: input.organisation,
        });
        await ensureOrganisationMap(org.id);

        const invitation = await createInvitation({
          email: input.email.toLowerCase().trim(),
          name: input.name,
          organisationId: org.id,
        });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
        const token = await new SignJWT({ invitationId: invitation.id })
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("7d")
          .sign(secret);

        await sendEmail(input.email, "Invite to Mapped", Invite({ token }));
        logger.info(
          `Created invitation for ${input.email}, ID ${invitation.id}`,
        );
      } catch (error) {
        logger.error("Could not create invitation", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unknown error",
        });
      }
    }),
  list: superadminProcedure.query(() => listUsers()),
  listInvitations: superadminProcedure.query(() => listPendingInvitations()),
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
