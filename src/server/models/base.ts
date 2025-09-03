import { ColumnType, Generated } from "kysely";
import z from "zod";

const baseFieldsSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
});

interface BaseFieldsPlain {
  id: string;
  createdAt: Date;
}

interface BaseFieldsDB {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
}

export type TableOf<
  Z extends z.ZodTypeAny,
  Overrides extends Partial<Record<keyof z.infer<Z>, unknown>> = Record<
    never,
    never
  >,
> = Omit<z.infer<Z>, keyof BaseFieldsPlain | keyof Overrides> &
  BaseFieldsDB &
  Overrides;

export const baseTableSchema = <S extends z.ZodRawShape>(shape: S) =>
  z.object({ ...baseFieldsSchema.shape, ...shape });
