import PgBoss from "pg-boss";
import importDataSource from "@/server/jobs/importDataSource";
import logger from "./logger";

const defaultQueue = process.env.DEFAULT_QUEUE_NAME || "default";

const boss = new PgBoss(process.env.DATABASE_URL ?? "");
boss.on("error", logger.error);

const taskHandlers: Record<string, (args: object | null) => Promise<boolean>> = {
  importDataSource
}

let startedQueues: Record<string, boolean> | null = null;
const ensureQueue = async (queue: string) => {
  if (startedQueues === null) {
    await boss.start();
    startedQueues = {};
  }
  if (!startedQueues[queue]) {
    await boss.createQueue(queue);
    startedQueues[queue] = true;
  }
};

export const enqueue = async (
  task: string,
  args: object,
  queue: string = defaultQueue
) => {
  await ensureQueue(queue);
  await boss.send(queue, { task, args });
  logger.info(`Enqueued job: ${JSON.stringify(args)}`);
};

export const runWorker = async (queue: string = defaultQueue) => {
  await ensureQueue(queue);

  await boss.work(queue, async ([job]) => {
    logger.info(`Received job ${job.id} with data ${JSON.stringify(job.data)}`);
    if (typeof job.data !== "object" || job.data === null) {
      logger.error(`Malformed job ${job.id}`);
      return;
    }
    const args = "args" in job.data ? job.data.args : null;
    if (typeof args !== "object") {
      logger.error(`Bad job ${job.id}: args is not an object`);
      return;
    }
    const task = "task" in job.data ? job.data.task : null;
    if (typeof task !== "string" || !(task in taskHandlers)) {
      logger.error(`Bad job ${job.id}: no ${task} handler`);
      return;
    }
    await taskHandlers[task](args);
  });

  logger.info(`Started worker on queue "${queue}"`);
};
