import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { getServerSession } from "@/auth";
import { findOrganisationUser } from "../repositories/OrganisationUser";
import { findUserById } from "../repositories/User";

export async function createContext() {
  const session = await getServerSession();
  let user = null;
  if (session.currentUser) {
    user = await findUserById(session.currentUser.id);
  }
  return { user };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user)
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action.",
    });
  return next({ ctx: { user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

const schema = z.object({
  organisationId: z.string(),
});

export const organisationProcedure = protectedProcedure
  .input(schema)
  .use(async ({ ctx, input, next }) => {
    const organisationUser = await findOrganisationUser(
      input.organisationId,
      ctx.user.id,
    );
    if (!organisationUser)
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not authorized to access this organisation",
      });
    return next({ ctx: { organisationUser, user: ctx.user } });
  });
