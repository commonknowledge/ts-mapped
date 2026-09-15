import { afterAll, describe, expect, test } from "vitest";
import { getPubSub } from "@/server/services/pubsub";
import { getClient } from "@/server/services/redis";

/**
 * ioredis as used in src/server/services: plain get/set/del (rate limiting,
 * public URL cache) and the RedisPubSub wrapper (publish + async-iterator
 * subscribe, used by tRPC subscriptions). Both clients pin protocol: 2
 * because ioredis 6 defaults to RESP3.
 */
describe("ioredis", () => {
  const key = `deps:redis:${Date.now()}`;

  afterAll(async () => {
    await getClient().del(key);
    await getPubSub().quit();
    await getClient().quit();
  });

  test("set / get / del", async () => {
    const redis = getClient();
    expect(await redis.set(key, "value")).toBe("OK");
    expect(await redis.get(key)).toBe("value");
    expect(await redis.del(key)).toBe(1);
    expect(await redis.get(key)).toBeNull();
  });

  test("publish reaches a subscribe() async iterator", async () => {
    const pubsub = getPubSub();
    const iterator = pubsub.subscribe("dataSourceEvent");
    const next = iterator.next(); // subscribes lazily on first next()
    await new Promise((resolve) => setTimeout(resolve, 100));
    await pubsub.publish("dataSourceEvent", {
      event: "ImportStarted",
      dataSourceId: "deps",
      at: new Date(),
    });
    const { value } = await next;
    expect(value).toMatchObject({
      event: "ImportStarted",
      dataSourceId: "deps",
    });
    await iterator.return?.();
  });
});
