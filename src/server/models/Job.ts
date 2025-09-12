import z from "zod";
import type { JSONColumnType } from "kysely";

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

export const jobSchema = z.object({
  data: jobDataSchema,
  completedOn: z.date().nullable(),
  startedOn: z.date().nullable(),
  state: z.enum(jobStates),
});

export interface JobTable {
  data: JSONColumnType<{ args: Record<string, unknown>; task: string }>;
  completedOn: Date | null;
  startedOn: Date | null;
  state: "created" | "retry" | "active" | "completed" | "cancelled" | "failed";
}
