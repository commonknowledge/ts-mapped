import PgBoss from "pg-boss";
import logger from "./logger";

export const DEFAULT_QUEUE = process.env.DEFAULT_QUEUE_NAME || "default";

export const boss = new PgBoss(process.env.DATABASE_URL ?? "");
boss.on("error", logger.error);

let startedQueues: Record<string, boolean> | null = null;
export const ensureQueue = async (queue: string) => {
  if (startedQueues === null) {
    await boss.start();
    startedQueues = {};
  }
  if (!startedQueues[queue]) {
    await boss.createQueue(queue, { name: queue, policy: "stately" });
    startedQueues[queue] = true;
  }
};

export const enqueue = async (
  task: string,
  key: string,
  args: object,
  queue: string = DEFAULT_QUEUE,
) => {
  await ensureQueue(queue);
  const jobId = await boss.send(
    queue,
    { task, args },
    { expireInHours: 8, singletonKey: `${task}-${key}` },
  );
  if (jobId) {
    logger.info(`Enqueued job ${jobId}: ${task}, ${JSON.stringify(args)}`);
  } else {
    logger.info(
      `Did not enqueue duplicate job: ${task}, ${JSON.stringify(args)}`,
    );
  }
};

export const schedule = async (
  cronSpec: string,
  task: string,
  args: object,
  queue: string = DEFAULT_QUEUE,
) => {
  await ensureQueue(queue);
  await boss.schedule(queue, cronSpec, { task, args });
  logger.info(`Scheduled job: ${cronSpec}, ${task}, ${JSON.stringify(args)}`);
};
