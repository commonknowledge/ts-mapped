import fs from "fs";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";
import type { ProvidedContext } from "vitest";

const testCredentials = JSON.parse(
  fs.readFileSync("test_credentials.json", "utf8"),
) as ProvidedContext;

for (const [key, value] of Object.entries(testCredentials.credentials)) {
  process.env[key] = String(value);
}

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "node",
    globalSetup: "./tests/setup.ts",
    provide: {
      credentials: testCredentials.credentials,
    },
  },
});
