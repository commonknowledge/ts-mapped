import { organisationSchema } from "@/server/models/Organisation";
import {
  findOrganisationsByUserId,
  updateOrganisation,
} from "@/server/repositories/Organisation";
import { organisationProcedure, protectedProcedure, router } from "../index";

export const organisationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return findOrganisationsByUserId(ctx.user.id);
  }),
  update: organisationProcedure
    .input(organisationSchema.pick({ name: true, avatarUrl: true }).partial())
    .mutation(async ({ input, ctx }) => {
      const organisation = await updateOrganisation(ctx.organisation.id, {
        name: input.name,
        avatarUrl: input.avatarUrl,
      });
      return organisation;
    }),
});
