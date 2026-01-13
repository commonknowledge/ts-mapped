import fs from "fs";
import http from "http";
import { db, pool } from "@/server/services/database";
import logger from "@/server/services/logger";
import { getPubSub } from "@/server/services/pubsub";
import { getClient as getRedisClient } from "@/server/services/redis";
import { startPublicTunnel, stopPublicTunnel } from "@/server/services/urls";

export async function setup() {
  // Load sampleAreas.psql into the test database
  const sampleAreasSql = fs.readFileSync(
    "tests/resources/sampleAreas.psql",
    "utf8",
  );
  // Use the underlying pg pool to run the SQL
  const client = await pool.connect();
  try {
    await client.query(sampleAreasSql, []);
  } finally {
    client.release();
  }

  // Start a server to handle webhooks (does nothing and returns OK)
  // Required because some CRMs do not allow the webhook to be created
  // if it does not return an OK response, which causes some tests to fail.
  let server = null;
  try {
    await startPublicTunnel("http");
    server = http.createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("OK");
    });
    server.listen(3000);
  } catch (error) {
    logger.warn("Could not start public tunnel", { error });
  }

  return async () => {
    await db.destroy();
    await getPubSub().quit();
    await stopPublicTunnel();
    await getRedisClient().quit();
    server?.close();
  };
}
