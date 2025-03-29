import { Insertable, JSONColumnType, Selectable, Updateable } from "kysely";

export interface JobTable {
  data: JSONColumnType<{ args: Record<string, unknown>; task: string }>;
  completedOn: Date | null;
  startedOn: Date | null;
  state: "created" | "retry" | "active" | "completed" | "cancelled" | "failed";
}

export type Area = Selectable<JobTable>;
export type NewArea = Insertable<JobTable>;
export type AreaUpdate = Updateable<JobTable>;
