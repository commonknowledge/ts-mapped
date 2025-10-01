import z from "zod";
import type { Insertable, Updateable } from "kysely";

import type { ColumnType, GeneratedAlways } from "kysely";

export const folderSchema = z.object({
  id: z.string(),
  name: z.string(),
  notes: z.string(),
  position: z.number(),
  mapId: z.string(),
  hideMarkers: z.boolean(),
});

export type Folder = z.infer<typeof folderSchema>;

export type FolderTable = Folder & {
  id: GeneratedAlways<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
};

export type NewFolder = Insertable<FolderTable>;
export type FolderUpdate = Updateable<FolderTable>;
