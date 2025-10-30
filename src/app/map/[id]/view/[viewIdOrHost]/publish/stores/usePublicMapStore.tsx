"use client";

import { createContext, useContext } from "react";
import { createStore, useStore } from "zustand";
import type {
  PublicMap,
  PublicMapColumn,
  PublicMapDataSourceConfig,
} from "@/server/models/PublicMap";
import type { Point } from "@/server/models/shared";
import type { RouterOutputs } from "@/services/trpc/react";
import type { FilterField, PublicFiltersFormValue } from "@/types";

interface PublicMapStore {
  // Public map state
  publicMap: RouterOutputs["publicMap"]["getPublished"] | null;
  editable: boolean;
  searchLocation: Point | null;
  setSearchLocation: (p: Point | null) => void;

  // Tab state
  activeTabId: string | null;
  setActiveTabId: (tabId: string | null) => void;
  activePublishTab: string;
  setActivePublishTab: (tab: string) => void;

  // UI state
  recordSidebarVisible: boolean;
  setRecordSidebarVisible: (visible: boolean) => void;
  colourScheme: string;
  setColourScheme: (scheme: string) => void;

  // Update functions
  updatePublicMap: (updates: Partial<PublicMap>) => void;
  updateDataSourceConfig: (
    dataSourceId: string,
    updates: Partial<PublicMapDataSourceConfig>,
  ) => void;
  updateAdditionalColumn: (
    dataSourceId: string,
    columnIndex: number,
    updates: Partial<PublicMapColumn>,
  ) => void;

  // Filter state
  filtersDialogOpen: boolean;
  setFiltersDialogOpen: (open: boolean) => void;
  filterFields: FilterField[];
  setFilterFields: (fields: FilterField[]) => void;
  publicFilters: Record<string, PublicFiltersFormValue[]>;
  setPublicFilters: (filters: Record<string, PublicFiltersFormValue[]>) => void;
  records: NonNullable<
    RouterOutputs["dataSource"]["byIdWithRecords"]
  >["records"];
  setRecords: (
    records: NonNullable<
      RouterOutputs["dataSource"]["byIdWithRecords"]
    >["records"],
  ) => void;

  // Initialization
  initialize: (
    initialPublicMap: NonNullable<RouterOutputs["publicMap"]["getPublished"]>,
    editable: boolean,
  ) => void;
}

export const createPublicMapStore = (
  initialPublicMap?: NonNullable<RouterOutputs["publicMap"]["getPublished"]>,
  editable?: boolean,
) => {
  return createStore<PublicMapStore>((set, get) => ({
    // Initial state
    publicMap: initialPublicMap || null,
    editable: editable || false,
    searchLocation: null,
    activeTabId: initialPublicMap?.dataSourceConfigs?.[0]?.dataSourceId || null,
    activePublishTab: "settings",
    recordSidebarVisible: false,
    colourScheme: "red",

    // Filter state
    filtersDialogOpen: false,
    filterFields: [],
    publicFilters: {},
    records: [],

    // Setters
    setSearchLocation: (searchLocation) => {
      set({ searchLocation });
    },
    setActiveTabId: (activeTabId) => {
      set({ activeTabId });
    },
    setActivePublishTab: (activePublishTab) => {
      set({ activePublishTab });
    },
    setRecordSidebarVisible: (recordSidebarVisible) => {
      set({ recordSidebarVisible });
    },
    setColourScheme: (colourScheme) => {
      set({ colourScheme });
    },
    setFiltersDialogOpen: (filtersDialogOpen) => {
      set({ filtersDialogOpen });
    },
    setFilterFields: (filterFields) => {
      set({ filterFields });
    },
    setPublicFilters: (publicFilters) => {
      set({ publicFilters });
    },
    setRecords: (records) => {
      set({ records });
    },

    // Update functions
    updatePublicMap: (updates) => {
      const current = get().publicMap;
      if (current) {
        set({ publicMap: { ...current, ...updates } });
      }
    },
    updateDataSourceConfig: (dataSourceId, updates) => {
      const current = get().publicMap;
      if (current) {
        set({
          publicMap: {
            ...current,
            dataSourceConfigs: current.dataSourceConfigs.map((dsc) => {
              if (dsc.dataSourceId === dataSourceId) {
                return { ...dsc, ...updates };
              }
              return dsc;
            }),
          },
        });
      }
    },
    updateAdditionalColumn: (dataSourceId, columnIndex, updates) => {
      const current = get().publicMap;
      if (current) {
        set({
          publicMap: {
            ...current,
            dataSourceConfigs: current.dataSourceConfigs.map((dsc) => {
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
          },
        });
      }
    },

    // Initialization
    initialize: (initialPublicMap, editable) => {
      set({
        publicMap: initialPublicMap,
        editable,
        activeTabId:
          initialPublicMap?.dataSourceConfigs?.[0]?.dataSourceId || null,
      });
    },
  }));
};

export const PublicMapStoreContext = createContext<ReturnType<
  typeof createPublicMapStore
> | null>(null);

export function usePublicMapStore<T>(
  selector: (state: PublicMapStore) => T,
): T {
  const store = useContext(PublicMapStoreContext);
  if (!store) throw new Error("Missing PublicMapStoreProvider");
  return useStore(store, selector);
}
