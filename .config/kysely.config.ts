import { defineConfig } from "kysely-ctl";
import { db } from "../src/server/services/database";

export default defineConfig({
  kysely: db,
});
