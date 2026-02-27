import { TRPCError } from "@trpc/server";
import { SignJWT } from "jose";
import z from "zod";
import Invite from "@/server/emails/Invite";
import InviteExistingUser from "@/server/emails/InviteExistingUser";
import { organisationSchema } from "@/server/models/Organisation";
import {
  createInvitation,
  findAndUseInvitation,
  updateInvitation,
} from "@/server/repositories/Invitation";
import {
  findOrganisationsByUserId,
  listOrganisations,
  updateOrganisation,
} from "@/server/repositories/Organisation";
import {
  findUsersByOrganisationId,
  upsertOrganisationUser,
} from "@/server/repositories/OrganisationUser";
import { findUserByEmail } from "@/server/repositories/User";
import logger from "@/server/services/logger";
import { sendEmail } from "@/server/services/mailer";
import {
  organisationProcedure,
  protectedProcedure,
  router,
  superadminProcedure,
} from "../index";

export const organisationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return findOrganisationsByUserId(ctx.user.id);
  }),
  listAll: superadminProcedure.query(() => {
    return listOrganisations();
  }),
  listUsers: organisationProcedure.query(async ({ ctx }) => {
    return findUsersByOrganisationId(ctx.organisation.id);
  }),
  acceptInvite: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const invitation = await findAndUseInvitation(input.invitationId);
      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found or already used",
        });
      }
      if (invitation.email !== ctx.user.email) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invitation is not for you",
        });
      }

      await upsertOrganisationUser({
        organisationId: invitation.organisationId,
        userId: ctx.user.id,
      });
      await updateInvitation(invitation.id, { userId: ctx.user.id });
    }),
  rejectInvite: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const invitation = await findAndUseInvitation(input.invitationId);
      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found or already used",
        });
      }
      if (invitation.email !== ctx.user.email) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invitation is not for you",
        });
      }
    }),
  inviteMember: organisationProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const email = input.email.toLowerCase().trim();
        const existingUser = await findUserByEmail(email);

        const invitation = await createInvitation({
          email,
          name: input.name,
          organisationId: ctx.organisation.id,
        });

        if (existingUser) {
          // Existing user: send a link to the in-app invitation page
          await sendEmail(
            email,
            `You've been invited to ${ctx.organisation.name} on Mapped`,
            InviteExistingUser({
              organisationName: ctx.organisation.name,
              invitationId: invitation.id,
            }),
          );
        } else {
          // New user: send the standard invite with token for signup
          const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
          const token = await new SignJWT({ invitationId: invitation.id })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("7d")
            .sign(secret);

          await sendEmail(email, "Invite to Mapped", Invite({ token }));
        }

        logger.info(
          `Created invitation for ${email} to org ${ctx.organisation.id} (existing user: ${!!existingUser})`,
        );
      } catch (error) {
        logger.error("Could not create invitation", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send invitation",
        });
      }
    }),
  update: organisationProcedure
    .input(organisationSchema.pick({ name: true, avatarUrl: true }).partial())
    .mutation(async ({ input, ctx }) => {
      const organisation = await updateOrganisation(ctx.organisation.id, {
        name: input.name,
        avatarUrl: input.avatarUrl,
      });
      return organisation;
    }),
});
