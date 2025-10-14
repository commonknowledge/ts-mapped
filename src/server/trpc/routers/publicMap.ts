import { TRPCError } from "@trpc/server";
import z from "zod";
import { publicMapSchema } from "@/server/models/PublicMap";
import {
  findPublicMapByHost,
  findPublicMapByViewIdAndUserId,
  findPublicMapsByOrganisationId,
  upsertPublicMap,
} from "@/server/repositories/PublicMap";
import {
  mapWriteProcedure,
  organisationProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "../index";

export const publicMapRouter = router({
  list: organisationProcedure.query(async ({ ctx }) => {
    return findPublicMapsByOrganisationId(ctx.organisation.id);
  }),
  getEditable: protectedProcedure
    .input(z.object({ viewId: z.string() }))
    .query(async ({ input, ctx }) => {
      const publicMap = await findPublicMapByViewIdAndUserId(
        input.viewId,
        ctx.user.id,
      );
      return publicMap || null;
    }),
  getPublished: publicProcedure
    .input(z.object({ host: z.string() }))
    .query(async ({ input }) => {
      const publicMap = await findPublicMapByHost(input.host);
      return publicMap?.published ? publicMap : null;
    }),
  upsert: mapWriteProcedure
    .input(publicMapSchema.omit({ createdAt: true, mapId: true, id: true }))
    .mutation(async ({ input }) => {
      const existingPublicMap = await findPublicMapByHost(input.host);

      if (existingPublicMap && existingPublicMap.viewId !== input.viewId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A public map already exists for this subdomain.",
        });
      }

      return upsertPublicMap(input);
    }),
});
