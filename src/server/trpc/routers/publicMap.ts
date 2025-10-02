import z from "zod";
import {
  findPublicMapByHost,
  findPublicMapByViewIdAndUserId,
} from "@/server/repositories/PublicMap";
import { findPublicMapsByOrganisationId } from "@/server/repositories/PublicMap";
import {
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
});
