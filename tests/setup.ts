import fs from "fs";
import http from "http";
import { startPublicTunnel } from "@/server/services/publicUrl";
import { pool } from "@/server/services/database";

const testCredentials = JSON.parse(
  fs.readFileSync("test_credentials.json", "utf8"),
);

export async function setup() {
  await startPublicTunnel(testCredentials.ngrokToken);

  // Load samplePostcodes.psql into the test database
  const samplePostcodesSql  = fs.readFileSync("tests/resources/samplePostcodes.psql", "utf8");
  // Use the underlying pg pool to run the SQL
  const client = await pool.connect();
  try {
    await client.query(samplePostcodesSql, []);
  } finally {
    client.release();
  }

  // Start a server to handle webhooks
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  });
  server.listen(3000);
  return async () => {
    server.close();
  };
}
