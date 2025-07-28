import { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface FolderTable {
  id: Generated<string>;
  name: string;
  mapId: string;
  notes: string;
  position: number;
}

export type Folder = Selectable<FolderTable>;
export type NewFolder = Insertable<FolderTable>;
export type FolderUpdate = Updateable<FolderTable>;
