import { z } from "zod";

export enum ColumnDisplayFormat {
  Auto = "Auto",
  Bar = "Bar",
}
export const columnDisplayFormats = Object.values(ColumnDisplayFormat);

export const inspectorColumnSchema = z.object({
  name: z.string(),
  displayFormat: z.nativeEnum(ColumnDisplayFormat).optional(),
  hidden: z.boolean().optional(),
});
export type InspectorColumn = z.infer<typeof inspectorColumnSchema>;
