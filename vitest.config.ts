import fs from "fs";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";
import type { ProvidedContext } from "vitest";

type VitestCredentials = ProvidedContext["credentials"];

interface TestCredentials extends VitestCredentials {
  env: {
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    NGROK_AUTHTOKEN: string;
  };
}

const testCredentials = JSON.parse(
  fs.readFileSync("test_credentials.json", "utf8"),
) as TestCredentials;

for (const [key, value] of Object.entries(testCredentials.env)) {
  process.env[key] = String(value);
}

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "node",
    globalSetup: "./tests/setup.ts",
    provide: { credentials: testCredentials },
  },
});
