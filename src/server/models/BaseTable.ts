import { ColumnType, Generated } from "kysely";
import z from "zod";

export const baseTableSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
});

export interface BaseTable {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
}
