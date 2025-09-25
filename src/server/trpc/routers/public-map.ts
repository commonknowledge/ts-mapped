import { TRPCError } from "@trpc/server";
import z from "zod";
import { publicMapSchema } from "@/server/models/PublicMap";
import {
  findPublicMapByHost,
  findPublicMapByViewId,
  upsertPublicMap,
} from "@/server/repositories/PublicMap";
import { publicMapViewProcedure, publicProcedure, router } from "../index";

export const publicMapRouter = router({
  byHostWherePublished: publicProcedure
    .input(z.object({ host: z.string() }))
    .query(async ({ input }) => {
      const publicMap = await findPublicMapByHost(input.host);
      if (!publicMap?.published) return null;
      return publicMap;
    }),

  byViewId: publicMapViewProcedure.query(({ input }) => {
    return findPublicMapByViewId(input.viewId);
  }),

  upsert: publicMapViewProcedure
    .input(publicMapSchema.omit({ createdAt: true, mapId: true, id: true }))
    .mutation(async ({ input, ctx: { view } }) => {
      const publicMap = findPublicMapByViewId(input.viewId);

      const existingPublicMap = await findPublicMapByHost(input.host);
      if (existingPublicMap && existingPublicMap.viewId !== input.viewId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A public map already exists for this subdomain.",
        });
      }
      if (!publicMap) throw new TRPCError({ code: "NOT_FOUND" });
      return upsertPublicMap({ ...publicMap, ...input, mapId: view.mapId });
    }),
});
