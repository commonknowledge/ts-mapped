import { PgBoss } from "pg-boss";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

/**
 * pg-boss as used in src/server/services/queue.ts: start, createQueue with a
 * policy, send with expireInSeconds + singletonKey (duplicates return null),
 * schedule, and fetch. Uses the test database.
 */
describe("pg-boss", () => {
  const boss = new PgBoss(process.env.DATABASE_URL ?? "");
  const queue = `deps-${Date.now()}`;

  beforeAll(async () => {
    await boss.start();
    await boss.createQueue(queue, { policy: "stately" });
  });

  afterAll(async () => {
    await boss.deleteQueue(queue);
    await boss.stop({ graceful: false });
  });

  test("send with singletonKey dedupes, fetch returns the job", async () => {
    const first = await boss.send(
      queue,
      { task: "t", args: {} },
      { expireInSeconds: 60, singletonKey: "t-key" },
    );
    const duplicate = await boss.send(
      queue,
      { task: "t", args: {} },
      { expireInSeconds: 60, singletonKey: "t-key" },
    );
    expect(first).toBeTypeOf("string");
    expect(duplicate).toBeNull();

    const jobs = await boss.fetch<{ task: string }>(queue);
    expect(jobs.map((j) => j.id)).toEqual([first]);
    expect(jobs[0].data.task).toBe("t");
  });

  test("schedule with a key", async () => {
    await boss.schedule(
      queue,
      "0 3 * * *",
      { task: "s", args: {} },
      { key: "s" },
    );
    const schedules = await boss.getSchedules();
    expect(schedules.some((s) => s.name === queue && s.key === "s")).toBe(true);
    await boss.unschedule(queue, "s");
  });
});
