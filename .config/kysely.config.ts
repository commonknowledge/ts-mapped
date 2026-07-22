import { defineConfig } from "kysely-ctl";
import { db, pool } from "../src/server/services/database";

/**
 * Kysely runs every pending migration in one transaction, so an ALTER TABLE
 * holds its ACCESS EXCLUSIVE lock until the whole run commits — and if it
 * can't take that lock, every query on the table queues behind it and the app
 * stops serving.
 *
 * Fail fast instead: a migration blocked on a lock aborts in seconds and the
 * deploy reports it, rather than hanging until the pipeline times out with
 * the app wedged behind it. This file is the migration CLI's entrypoint, so
 * the timeout doesn't apply to the running app.
 */
pool.on("connect", (client) => {
  void client.query("SET lock_timeout = '10s'");
});

export default defineConfig({
  kysely: db,
});
