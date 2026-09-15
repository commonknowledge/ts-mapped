import { sql } from "kysely";
import { afterAll, describe, expect, test } from "vitest";
import { db } from "@/server/services/database";

/**
 * Every query shape used in src/server/repositories, run against the test
 * database: selectFrom + where + orderBy, insertInto + onConflict +
 * returningAll, updateTable + returning, deleteFrom, innerJoin, case
 * expressions, fn.countAll, stream, transactions and the sql tag with the
 * CamelCasePlugin (camelCase in the builder, snake_case in raw SQL).
 */
describe("kysely", () => {
  const prefix = `deps-kysely-${Date.now()}`;
  const ids: string[] = [];

  afterAll(async () => {
    await db.deleteFrom("organisation").where("id", "in", ids).execute();
  });

  test("insertInto + returningAll, selectFrom + where + orderBy", async () => {
    const a = await db
      .insertInto("organisation")
      .values({ name: `${prefix}-a` })
      .returningAll()
      .executeTakeFirstOrThrow();
    const b = await db
      .insertInto("organisation")
      .values({ name: `${prefix}-b` })
      .returningAll()
      .executeTakeFirstOrThrow();
    ids.push(a.id, b.id);

    expect(a.id).toBeTypeOf("string");
    // timestamptz columns come back as strings from pg; the app parses them.
    expect(new Date(a.createdAt).getTime()).not.toBeNaN();
    expect(a.features).toEqual([]);

    const rows = await db
      .selectFrom("organisation")
      .select(["id", "name"])
      .where("name", "like", `${prefix}-%`)
      .orderBy("name", "desc")
      .execute();
    expect(rows.map((r) => r.name)).toEqual([`${prefix}-b`, `${prefix}-a`]);
  });

  test("onConflict doUpdateSet + returningAll (the upsert pattern)", async () => {
    const [id] = ids;
    const row = await db
      .insertInto("organisation")
      .values({ id, name: `${prefix}-a-updated` })
      .onConflict((oc) =>
        oc.column("id").doUpdateSet({ name: `${prefix}-a-updated` }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();
    expect(row.id).toBe(id);
    expect(row.name).toBe(`${prefix}-a-updated`);
  });

  test("updateTable + returning, executeTakeFirst on no match", async () => {
    const [id] = ids;
    const updated = await db
      .updateTable("organisation")
      .set({ name: `${prefix}-a` })
      .where("id", "=", id)
      .returning("name")
      .executeTakeFirst();
    expect(updated?.name).toBe(`${prefix}-a`);

    const missing = await db
      .selectFrom("organisation")
      .selectAll()
      .where("id", "=", "00000000-0000-0000-0000-000000000000")
      .executeTakeFirst();
    expect(missing).toBeUndefined();
  });

  test("innerJoin, fn.countAll and case expressions", async () => {
    const counted = await db
      .selectFrom("organisation")
      .select((eb) => eb.fn.countAll<string>().as("count"))
      .where("name", "like", `${prefix}-%`)
      .executeTakeFirstOrThrow();
    expect(Number(counted.count)).toBe(2);

    const labelled = await db
      .selectFrom("organisation as o")
      .innerJoin("organisation as o2", "o2.id", "o.id")
      .select((eb) => [
        "o.name",
        eb
          .case()
          .when("o.name", "=", `${prefix}-a`)
          .then("first")
          .else("other")
          .end()
          .as("label"),
      ])
      .where("o.name", "like", `${prefix}-%`)
      .orderBy("o.name")
      .execute();
    expect(labelled.map((r) => r.label)).toEqual(["first", "other"]);
  });

  test("stream()", async () => {
    const seen: string[] = [];
    const query = db
      .selectFrom("organisation")
      .select("name")
      .where("name", "like", `${prefix}-%`)
      .orderBy("name");
    for await (const row of query.stream(1)) {
      seen.push(row.name);
    }
    expect(seen).toEqual([`${prefix}-a`, `${prefix}-b`]);
  });

  test("transaction rolls back on throw", async () => {
    await expect(
      db.transaction().execute(async (trx) => {
        const row = await trx
          .insertInto("organisation")
          .values({ name: `${prefix}-rollback` })
          .returningAll()
          .executeTakeFirstOrThrow();
        expect(row.id).toBeTypeOf("string");
        throw new Error("rollback");
      }),
    ).rejects.toThrow("rollback");
    const row = await db
      .selectFrom("organisation")
      .select("id")
      .where("name", "=", `${prefix}-rollback`)
      .executeTakeFirst();
    expect(row).toBeUndefined();
  });

  test("sql tag with snake_case columns and CamelCasePlugin on results", async () => {
    const result = await sql<{ createdAt: string; name: string }>`
      SELECT created_at, name FROM organisation WHERE name = ${`${prefix}-a`}
    `.execute(db);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe(`${prefix}-a`);
    expect(new Date(result.rows[0].createdAt).getTime()).not.toBeNaN();
  });
});
