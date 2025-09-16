import { createRedisEventTarget } from "@graphql-yoga/redis-event-target";
import { createPubSub } from "graphql-yoga";
import { Redis } from "ioredis";
import type { DataSourceEvent } from "@/__generated__/types";

const publishClient = new Redis(process.env.REDIS_URL || "");
const subscribeClient = new Redis(process.env.REDIS_URL || "");

const eventTarget = createRedisEventTarget({
  publishClient,
  subscribeClient,
});

const pubSub = createPubSub<{
  dataSourceEvent: [{ dataSourceEvent: DataSourceEvent }];
}>({ eventTarget });

export const quit = async () => {
  await publishClient.quit();
  await subscribeClient.quit();
};

export default pubSub;
