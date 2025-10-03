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

export const jobSchema = z.object({
  id: z.string(),
  data: jobDataSchema,
  completedOn: z.date().nullable(),
  createdOn: z.date(),
  startAfter: z.date(),
  startedOn: z.date().nullable(),
  state: z.enum(jobStates),
});

export type JobTable = z.infer<typeof jobSchema>;
