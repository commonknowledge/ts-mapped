import { Insertable, Updateable } from "kysely";

import { ColumnType, GeneratedAlways } from "kysely";
import z from "zod";

export const folderSchema = z.object({
  id: z.string(),
  name: z.string(),
  notes: z.string(),
  position: z.number(),
  mapId: z.string(),
});

export type Folder = z.infer<typeof folderSchema>;

export type FolderTable = Folder & {
  id: GeneratedAlways<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
};

export type NewFolder = Insertable<FolderTable>;
export type FolderUpdate = Updateable<FolderTable>;
