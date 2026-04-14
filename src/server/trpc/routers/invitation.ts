import { TRPCError } from "@trpc/server";
import { SignJWT } from "jose";
import z from "zod";
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
        })
        .refine((data) => data.organisationId || data.organisationName, {
          message: "Either organisationId or organisationName must be provided",
          path: ["organisationId", "organisationName"],
        }),
    )
    .mutation(async ({ input }) => {
      try {
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
        if (error instanceof TRPCError) throw error;
        logger.error("Could not create invitation", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unknown error",
        });
      }
    }),
  list: advocateProcedure.query(() => listPendingInvitations()),
  listForUser: protectedProcedure.query(async ({ ctx }) => {
    return findPendingInvitationsByEmail(ctx.user.email);
  }),
});
