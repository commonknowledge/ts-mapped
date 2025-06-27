import fs from "fs";
import http from "http";
import { startPublicTunnel } from "@/server/services/publicUrl";

const testCredentials = JSON.parse(
  fs.readFileSync("test_credentials.json", "utf8"),
);

export async function setup() {
  await startPublicTunnel(testCredentials.ngrokToken);

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
