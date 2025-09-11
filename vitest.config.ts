import fs from "fs";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

interface ProvidedContext {
  env: {
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    NGROK_AUTHTOKEN: string;
  };
  actionnetwork: {
    apiKey: string;
  };
  airtable: {
    baseId: string;
    tableId: string;
    apiKey: string;
  };
  googlesheets: {
    spreadsheetId: string;
    sheetName: string;
    oAuthCredentials: {
      access_token: string;
      refresh_token: string;
      scope: string;
      token_type: string;
      expiry_date: number;
    };
  };
  mailchimp: {
    apiKey: string;
    listId: string;
  };
}

const testCredentials = JSON.parse(
  fs.readFileSync("test_credentials.json", "utf8")
) as ProvidedContext;

for (const [key, value] of Object.entries(testCredentials)) {
  process.env[key] = String(value);
}

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "node",
    globalSetup: "./tests/setup.ts",
    provide: testCredentials,
  },
});
