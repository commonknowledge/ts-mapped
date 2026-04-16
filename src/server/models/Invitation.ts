import type { Invitation } from "@/models/Invitation";
import type {
  ColumnType,
  Generated,
  GeneratedAlways,
  Insertable,
  Updateable,
} from "kysely";

export type InvitationTable = Invitation & {
  id: GeneratedAlways<string>;
  used: Generated<boolean>;
  isTrial: Generated<boolean>;
  createdAt: ColumnType<Date, string | undefined, never>;
  updatedAt: ColumnType<Date, string | undefined, string>;
};
export type NewInvitation = Insertable<InvitationTable>;
export type InvitationUpdate = Updateable<InvitationTable>;
