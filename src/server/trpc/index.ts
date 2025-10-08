import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import z, { ZodError } from "zod";
import { getServerSession } from "@/auth";
import {
  hasPasswordHashSerializer,
  serverDataSourceSerializer,
} from "@/utils/superjson";
import { findDataSourceById } from "../repositories/DataSource";
import { findMapById } from "../repositories/Map";
import { findOrganisationForUser } from "../repositories/Organisation";
import {
  findPublishedPublicMapByDataSourceId,
  findPublishedPublicMapByMapId,
} from "../repositories/PublicMap";
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

// Prevent sensitive fields being sent to the client
superjson.registerCustom(serverDataSourceSerializer, "DataSource");
superjson.registerCustom(hasPasswordHashSerializer, "HasPasswordHash");

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // This catches any errors and gives us a nice formError + fieldErrors key to use in the frontend
    return {
      ...shape,
      data: {
        ...shape.data,
        formError: !(error.cause instanceof ZodError)
          ? error.code === "INTERNAL_SERVER_ERROR"
            ? "There was an error processing your request."
            : error.message
          : undefined,
        zodError:
          error.code === "BAD_REQUEST" && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
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

export const dataSourceReadProcedure = publicProcedure
  .input(z.object({ dataSourceId: z.string() }))
  .use(async ({ ctx, input, next }) => {
    const dataSource = await findDataSourceById(input.dataSourceId);

    if (!dataSource)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Data source not found",
      });

    if (dataSource.public) {
      return next({ ctx: { dataSource } });
    }

    const publicMap = await findPublishedPublicMapByDataSourceId(dataSource.id);
    if (publicMap) {
      return next({ ctx: { dataSource } });
    }

    if (!ctx.user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Data source not found",
      });
    }

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

export const dataSourceOwnerProcedure = protectedProcedure
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

export const mapWriteProcedure = protectedProcedure
  .input(z.object({ mapId: z.string() }))
  .use(async ({ ctx, input, next }) => {
    const map = await findMapById(input.mapId);

    if (!map)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Map not found",
      });

    const organisation = await findOrganisationForUser(
      map.organisationId,
      ctx.user.id,
    );

    if (!organisation)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Organisation not found",
      });

    return next({ ctx: { organisation, map } });
  });

export const mapReadProcedure = publicProcedure
  .input(z.object({ mapId: z.string() }))
  .use(async ({ ctx, input, next }) => {
    const map = await findMapById(input.mapId);

    if (!map) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Map not found",
      });
    }

    const publicMap = await findPublishedPublicMapByMapId(map.id);
    if (publicMap) {
      return next({ ctx: { map } });
    }

    if (!ctx.user?.id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Map not found",
      });
    }

    const organisation = await findOrganisationForUser(
      map.organisationId,
      ctx.user.id,
    );

    if (!organisation) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Organisation not found",
      });
    }

    return next({ ctx: { organisation, map } });
  });
