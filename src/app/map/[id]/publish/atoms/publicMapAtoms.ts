import { atom } from "jotai";
import type {
  PublicMap,
  PublicMapColumn,
  PublicMapDataSourceConfig,
} from "@/server/models/PublicMap";
import type { Point } from "@/server/models/shared";
import type { RouterOutputs } from "@/services/trpc/react";

export type PublicMapData = RouterOutputs["publicMap"]["getPublished"];

export const publicMapAtom = atom<PublicMapData>(null);
export const editableAtom = atom<boolean>(false);
export const searchLocationAtom = atom<Point | null>(null);
export const activeTabIdAtom = atom<string | null>(null);
export const activePublishTabAtom = atom<string>("settings");

// Derived read-only atom
export const colorSchemeAtom = atom<string>((get) => {
  const publicMap = get(publicMapAtom);
  return publicMap?.colorScheme || "red";
});

// Write atom for partial updates
export const updatePublicMapAtom = atom(
  null,
  (get, set, updates: Partial<PublicMap>) => {
    const publicMap = get(publicMapAtom);
    if (publicMap) {
      set(publicMapAtom, { ...publicMap, ...updates });
    }
  },
);

// Write atom for updating a data source config
export const updateDataSourceConfigAtom = atom(
  null,
  (
    get,
    set,
    dataSourceId: string,
    updates: Partial<PublicMapDataSourceConfig>,
  ) => {
    const publicMap = get(publicMapAtom);
    if (publicMap) {
      set(publicMapAtom, {
        ...publicMap,
        dataSourceConfigs: publicMap.dataSourceConfigs.map((dsc) => {
          if (dsc.dataSourceId === dataSourceId) {
            return { ...dsc, ...updates };
          }
          return dsc;
        }),
      });
    }
  },
);

// Write atom for updating an additional column
export const updateAdditionalColumnAtom = atom(
  null,
  (
    get,
    set,
    dataSourceId: string,
    columnIndex: number,
    updates: Partial<PublicMapColumn>,
  ) => {
    const publicMap = get(publicMapAtom);
    if (publicMap) {
      set(publicMapAtom, {
        ...publicMap,
        dataSourceConfigs: publicMap.dataSourceConfigs.map((dsc) => {
          if (dsc.dataSourceId === dataSourceId) {
            return {
              ...dsc,
              additionalColumns: dsc.additionalColumns.map((c, i) => {
                if (i === columnIndex) {
                  return { ...c, ...updates };
                }
                return c;
              }),
            };
          }
          return dsc;
        }),
      });
    }
  },
);
