import { JSONColumnType } from "kysely";
import z from "zod";

const jobDataSchema = z.object({
  args: z.record(z.string(), z.unknown()),
  task: z.string(),
});

const jobStates = [
  "created",
  "retry",
  "active",
  "completed",
  "cancelled",
  "failed",
] as const;
const jobState = z.enum(jobStates);

export const jobSchema = z.object({
  data: jobDataSchema,
  completedOn: z.date().nullable(),
  startedOn: z.date().nullable(),
  state: jobState,
});

export interface JobTable {
  data: JSONColumnType<{ args: Record<string, unknown>; task: string }>;
  completedOn: Date | null;
  startedOn: Date | null;
  state: "created" | "retry" | "active" | "completed" | "cancelled" | "failed";
}
