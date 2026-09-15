import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

/**
 * Config for `npm run test:deps`: fast checks that the ways this codebase
 * uses its load-bearing dependencies still work. No ngrok, no webhook server,
 * no third-party APIs, no test_credentials.json. Needs only the test database
 * and Redis from docker-compose.
 */
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "node",
    include: ["tests/deps/**/*.test.{ts,tsx}"],
    testTimeout: 15_000,
  },
});
