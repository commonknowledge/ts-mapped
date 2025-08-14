import PgBoss from "pg-boss";
import enrichDataRecords from "@/server/jobs/enrichDataRecords";
import enrichDataSource from "@/server/jobs/enrichDataSource";
import importDataRecords from "@/server/jobs/importDataRecords";
import importDataSource from "@/server/jobs/importDataSource";
import refreshWebhooks from "@/server/jobs/refreshWebhooks";
import tagDataSource from "@/server/jobs/tagDataSource";
import logger from "./logger";

const defaultQueue = process.env.DEFAULT_QUEUE_NAME || "default";

const boss = new PgBoss(process.env.DATABASE_URL ?? "");
boss.on("error", logger.error);

const taskHandlers: Record<string, (args: object | null) => Promise<boolean>> =
  {
    enrichDataSource,
    enrichDataRecords,
    importDataSource,
    importDataRecords,
    refreshWebhooks,
    tagDataSource,
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
  logger.info(`Enqueued job: ${task}, ${JSON.stringify(args)}`);
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
      logger.info(
        `Completed job ${job.id} with data ${JSON.stringify(job.data)}`,
      );
    } catch (error) {
      logger.error(`Failed job ${job.id}`, { error });
      // Re-throw so PgBoss knows the job failed
      throw error;
    }
  });

  logger.info(`Started worker on queue "${queue}"`);
};

export const schedule = async (
  cronSpec: string,
  task: string,
  args: object,
  queue: string = defaultQueue,
) => {
  await ensureQueue(queue);
  await boss.schedule(queue, cronSpec, { task, args });
  logger.info(`Scheduled job: ${cronSpec}, ${task}, ${JSON.stringify(args)}`);
};
