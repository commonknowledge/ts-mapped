import { TRPCError } from "@trpc/server";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import z from "zod";
import ensureOrganisationMap from "@/server/commands/ensureOrganisationMap";
import ForgotPassword from "@/server/emails/forgot-password";
import { updateUnusedInvitation } from "@/server/repositories/Invitation";
import { upsertOrganisationUser } from "@/server/repositories/OrganisationUser";
import {
  findUserByEmail,
  findUserByToken,
  updateUser,
  upsertUser,
} from "@/server/repositories/User";
import logger from "@/server/services/logger";
import { sendEmail } from "@/server/services/mailer";
import { publicProcedure, router } from "../index";
import { NoResultError } from "kysely";

export const authRouter = router({
  confirmInvite: publicProcedure
    .input(z.object({ token: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const { password, token } = input;

        // Decode JWT to get invitation ID
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
        const { payload } = await jwtVerify<{ invitationId: string }>(
          token,
          secret,
        );

        // Find and update invitation by ID (prevents duplicate requests)
        const invitation = await updateUnusedInvitation(payload.invitationId, {
          used: true,
        });
        if (!invitation)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invitation not found",
          });

        // Verify invitation hasn't been used already
        if (invitation.userId)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invitation already used",
          });

        // Create user with provided password
        const user = await upsertUser({
          email: invitation.email,
          name: invitation.name,
          password,
        });

        // Link user to organisation
        await upsertOrganisationUser({
          organisationId: invitation.organisationId,
          userId: user.id,
        });

        // Ensure organisation map exists
        await ensureOrganisationMap(invitation.organisationId);

        // Set JWT cookie and log user in
        const cookieToken = await new SignJWT({
          id: user.id,
          email: user.email,
        })
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("24h")
          .sign(secret);

        const cookieStore = await cookies();
        cookieStore.set("JWT", cookieToken);
        return user;
      } catch (error) {
        console.log('error', JSON.stringify(error))
        if (error instanceof NoResultError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invitation already used",
          });
        }
        logger.error("Confirm invite failed", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unknown error",
        });
      }
    }),
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string() }))
    .mutation(async ({ input }) => {
      const { email } = input;
      const user = await findUserByEmail(email);
      if (!user) return true;

      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
      const token = await new SignJWT({ id: user.id })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("15m")
        .sign(secret);

      await sendEmail(email, "Reset your password", ForgotPassword({ token }));
      return true;
    }),
  resetPassword: publicProcedure
    .input(z.object({ token: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      const { token, password } = input;
      const user = await findUserByToken(token);
      if (!user) return false;
      return await updateUser(user.id, { newPassword: password });
    }),
});
