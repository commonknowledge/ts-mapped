import { Generated, Selectable } from "kysely";

export interface MarkerFolderTable {
  id: Generated<string>;
  name: string;
  markerIds: string;
  isExpanded: boolean;
  mapId: string;
  position: number;
  createdAt: Generated<Date>;
}

export type MarkerFolder = Selectable<MarkerFolderTable>;
export interface NewMarkerFolder {
  name: string;
  markerIds: string[];
  isExpanded: boolean;
  mapId: string;
  position?: number;
}
export interface MarkerFolderUpdate {
  name?: string;
  markerIds?: string[];
  isExpanded?: boolean;
  mapId?: string;
  position?: number;
}
