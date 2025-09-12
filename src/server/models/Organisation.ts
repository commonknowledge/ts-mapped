import { z } from "zod";
import type { ColumnType, Generated, Insertable, Updateable } from "kysely";

export const organisationSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.date(),
});

export type Organisation = z.infer<typeof organisationSchema>;

export type OrganisationTable = Organisation & {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
};

export type NewOrganisation = Insertable<OrganisationTable>;
export type OrganisationUpdate = Updateable<OrganisationTable>;
