import { logger } from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";
import { SignJWT } from "jose";
import z from "zod";
import ensureOrganisationMap from "@/server/commands/ensureOrganisationMap";
import Invite from "@/server/emails/invite";
import {
  createInvitation,
  listPendingInvitations,
} from "@/server/repositories/Invitation";
import {
  findOrganisationById,
  upsertOrganisation,
} from "@/server/repositories/Organisation";
import { sendEmail } from "@/server/services/mailer";
import { router, superadminProcedure } from "..";

export const invitationRouter = router({
  create: superadminProcedure
    .input(
      z
        .object({
          name: z.string(),
          email: z.string().email(),
          organisationId: z.string().nullish(),
          organisationName: z.string().nullish(),
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
        console.log(error);

        logger.error("Could not create invitation", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unknown error",
        });
      }
    }),
  list: superadminProcedure.query(() => listPendingInvitations()),
});
