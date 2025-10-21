import { z } from "zod";
import type {
  ColumnType,
  Generated,
  GeneratedAlways,
  Insertable,
  Updateable,
} from "kysely";

export const invitationSchema = z.object({
  id: z.string(),
  email: z.string().email().trim().toLowerCase(),
  name: z.string().trim(),
  organisationId: z.string(),
  userId: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
  used: z.boolean(),
});

export type Invitation = z.infer<typeof invitationSchema>;

export type InvitationTable = Invitation & {
  id: GeneratedAlways<string>;
  used: Generated<boolean>;
  createdAt: ColumnType<Date, string | undefined, never>;
  updatedAt: ColumnType<Date, string | undefined, string>;
};

export type NewInvitation = Insertable<InvitationTable>;
export type InvitationUpdate = Updateable<InvitationTable>;
