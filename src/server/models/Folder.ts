import z from "zod";
import type { Generated, Insertable, Updateable } from "kysely";

export const folderSchema = z.object({
  id: z.string(),
  name: z.string(),
  notes: z.string(),
  position: z.number(),
  mapId: z.string(),
  hideMarkers: z.boolean().nullish(),
});

export type Folder = z.infer<typeof folderSchema>;

export type FolderTable = Folder & {
  id: Generated<string>;
};

export type NewFolder = Insertable<FolderTable>;
export type FolderUpdate = Updateable<FolderTable>;
