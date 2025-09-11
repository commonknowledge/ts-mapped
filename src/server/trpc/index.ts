import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import z from "zod";
import { getServerSession } from "@/auth";
import { findDataSourceById } from "../repositories/DataSource";
import { findOrganisationForUser } from "../repositories/Organisation";
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

export const organisationProcedure = protectedProcedure
  .input(z.object({ organisationId: z.string() }))
  .use(async ({ ctx, input, next }) => {
    const organisation = await findOrganisationForUser(
      input.organisationId,
      ctx.user.id,
    );
    if (!organisation)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Organisation not found",
      });

    return next({ ctx: { organisation } });
  });

export const dataSourceProcedure = protectedProcedure
  .input(z.object({ dataSourceId: z.string() }))
  .use(async ({ ctx, input, next }) => {
    const dataSource = await findDataSourceById(input.dataSourceId);

    if (!dataSource)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Data source not found",
      });

    const organisation = await findOrganisationForUser(
      dataSource.organisationId,
      ctx.user.id,
    );
    if (!organisation)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Organisation not found",
      });

    return next({ ctx: { organisation, dataSource } });
  });
