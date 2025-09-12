import { organisationSchema } from "@/server/models/Organisation";
import { updateOrganisation } from "@/server/repositories/Organisation";
import { organisationProcedure, router } from "../index";

export const organisationRouter = router({
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
