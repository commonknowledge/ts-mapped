import type { Folder } from "@/models/Folder";
import type { Generated, Insertable, Updateable } from "kysely";

export type FolderTable = Folder & {
  id: Generated<string>;
};
export type NewFolder = Insertable<FolderTable>;
export type FolderUpdate = Updateable<FolderTable>;
