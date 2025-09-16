import { createMap, findMapsByOrganisationId } from "@/server/repositories/Map";
import { organisationProcedure, router } from "../index";

export const mapRouter = router({
  list: organisationProcedure.query(async ({ ctx }) => {
    return findMapsByOrganisationId(ctx.organisation.id);
  }),
  create: organisationProcedure.mutation(async ({ ctx }) => {
    return createMap(ctx.organisation.id);
  }),
});
