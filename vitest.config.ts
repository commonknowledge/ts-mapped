import fs from "fs";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const testCredentials = JSON.parse(
  fs.readFileSync("test_credentials.json", "utf8"),
);

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    env: {
      BASE_URL: "", // Vitest sets this env var to "/", which overwrites the ngrok URL
    },
    environment: "jsdom",
    globalSetup: "./tests/setup.ts",
    provide: {
      credentials: testCredentials,
    },
  },
});
