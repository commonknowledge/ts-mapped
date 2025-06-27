import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import Cursor from "pg-cursor";
import { Database } from "@/server/models";
import { PointPlugin } from "./plugins";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const dialect = new PostgresDialect({
  cursor: Cursor,
  pool
});

export const db = new Kysely<Database>({
  dialect,
  plugins: [
    new CamelCasePlugin(), // Database `field_name` to TypeScript `fieldName`
    new PointPlugin(),
  ],
  log: ["error"],
});
