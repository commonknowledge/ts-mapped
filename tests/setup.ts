import fs from "fs";
import http from "http";
import { db, pool } from "@/server/services/database";
import { quit as quitRedis } from "@/server/services/pubsub";
import { getClient as getRedisClient } from "@/server/services/redis";
import { startPublicTunnel, stopPublicTunnel } from "@/server/services/urls";

export async function setup() {
  // Load samplePostcodes.psql into the test database
  const samplePostcodesSql = fs.readFileSync(
    "tests/resources/samplePostcodes.psql",
    "utf8",
  );
  // Use the underlying pg pool to run the SQL
  const client = await pool.connect();
  try {
    await client.query(samplePostcodesSql, []);
  } finally {
    client.release();
  }

  // Start a server to handle webhooks
  await startPublicTunnel("http");
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  });
  server.listen(3000);

  return async () => {
    await db.destroy();
    await quitRedis();
    await stopPublicTunnel();
    await getRedisClient().quit();
    server.close();
  };
}
