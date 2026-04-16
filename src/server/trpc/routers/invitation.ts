import { TRPCError } from "@trpc/server";
import { SignJWT } from "jose";
import z from "zod";
import { DEFAULT_TRIAL_PERIOD_DAYS } from "@/constants";
import { UserRole } from "@/models/User";
import copyMapsToOrganisation from "@/server/commands/copyMapsToOrganisation";
import ensureOrganisationMap from "@/server/commands/ensureOrganisationMap";
import Invite from "@/server/emails/Invite";
import {
  createInvitation,
  findPendingInvitationsByEmail,
  listPendingInvitations,
} from "@/server/repositories/Invitation";
import {
  findOrganisationById,
  findOrganisationForUser,
  upsertOrganisation,
} from "@/server/repositories/Organisation";
import logger from "@/server/services/logger";
import { sendEmail } from "@/server/services/mailer";
import { advocateProcedure, protectedProcedure, router } from "..";

export const invitationRouter = router({
  create: advocateProcedure
    .input(
      z
        .object({
          name: z.string(),
          email: z.string().email(),
          senderOrganisationId: z.string(),
          organisationId: z.string().nullish(),
          organisationName: z.string().nullish(),
          mapSelections: z
            .array(
              z.object({
                mapId: z.string(),
                dataSourceIds: z.array(z.string()),
              }),
            )
            .optional(),
          isTrial: z.boolean().optional(),
          trialDays: z.number().int().min(1).optional(),
        })
        .refine((data) => data.organisationId || data.organisationName, {
          message: "Either organisationId or organisationName must be provided",
          path: ["organisationId", "organisationName"],
        }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const senderOrg = await findOrganisationForUser(
          input.senderOrganisationId,
          ctx.user.id,
        );
        if (!senderOrg) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not belong to the sender organisation",
          });
        }

        let org;
        if (input.organisationId) {
          org = await findOrganisationById(input.organisationId);
        } else if (input.organisationName) {
          org = await upsertOrganisation({ name: input.organisationName });
        }

        if (!org) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Organisation not found",
          });
        }

        if (input.mapSelections && input.mapSelections.length > 0) {
          await copyMapsToOrganisation(input.mapSelections, org.id);
        } else {
          await ensureOrganisationMap(org.id);
        }

        const isSuperadmin = ctx.user.role === UserRole.Superadmin;
        const isTrial = isSuperadmin ? Boolean(input.isTrial) : true;
        const trialDays = isTrial
          ? isSuperadmin
            ? (input.trialDays ?? DEFAULT_TRIAL_PERIOD_DAYS)
            : DEFAULT_TRIAL_PERIOD_DAYS
          : null;

        const invitation = await createInvitation({
          email: input.email.toLowerCase().trim(),
          name: input.name,
          organisationId: org.id,
          senderOrganisationId: senderOrg.id,
          isTrial,
          trialDays,
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
        if (error instanceof TRPCError) throw error;
        logger.error("Could not create invitation", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unknown error",
        });
      }
    }),
  list: advocateProcedure
    .input(z.object({ senderOrganisationId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const org = await findOrganisationForUser(
        input.senderOrganisationId,
        ctx.user.id,
      );
      if (!org) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not belong to this organisation",
        });
      }
      return listPendingInvitations(org.id);
    }),
  listForUser: protectedProcedure.query(async ({ ctx }) => {
    return findPendingInvitationsByEmail(ctx.user.email);
  }),
});
