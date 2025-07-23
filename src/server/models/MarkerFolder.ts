import { Generated, Selectable } from "kysely";

export interface MarkerFolderTable {
  id: Generated<string>;
  name: string;
  markerIds: string;
  isExpanded: boolean;
  mapId: string;
  createdAt: Generated<Date>;
}

export type MarkerFolder = Selectable<MarkerFolderTable>;
export interface NewMarkerFolder {
  name: string;
  markerIds: string[];
  isExpanded: boolean;
  mapId: string;
}
export interface MarkerFolderUpdate {
  name?: string;
  markerIds?: string[];
  isExpanded?: boolean;
  mapId?: string;
}
