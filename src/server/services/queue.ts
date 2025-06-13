import PgBoss from "pg-boss";
import enrichDataSource from "@/server/jobs/enrichDataSource";
import importDataSource from "@/server/jobs/importDataSource";
import logger from "./logger";

const defaultQueue = process.env.DEFAULT_QUEUE_NAME || "default";

const boss = new PgBoss(process.env.DATABASE_URL ?? "");
boss.on("error", logger.error);

const taskHandlers: Record<string, (args: object | null) => Promise<boolean>> =
  {
    enrichDataSource,
    importDataSource,
  };

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
  queue: string = defaultQueue,
) => {
  await ensureQueue(queue);
  await boss.send(queue, { task, args }, { expireInHours: 8 });
  logger.info(`Enqueued job: ${JSON.stringify(args)}`);
};

export const runWorker = async (queue: string = defaultQueue) => {
  await ensureQueue(queue);

  await boss.work(queue, async ([job]) => {
    try {
      logger.info(
        `Received job ${job.id} with data ${JSON.stringify(job.data)}`,
      );
      if (typeof job.data !== "object" || job.data === null) {
        throw Error(`Malformed job data`);
      }
      const args = "args" in job.data ? job.data.args : null;
      if (typeof args !== "object") {
        throw Error(`Job args was not an object`);
      }
      const task = "task" in job.data ? job.data.task : null;
      if (typeof task !== "string" || !(task in taskHandlers)) {
        throw Error(`Missing handler for task ${task}`);
      }
      const success = await taskHandlers[task](args);
      if (!success) {
        throw Error(`Handler ${task} not complete successfully`);
      }
    } catch (error) {
      logger.error(`Failed job ${job.id}`, { error });
      // Re-throw so PgBoss knows the job failed
      throw error;
    }
  });

  logger.info(`Started worker on queue "${queue}"`);
};
