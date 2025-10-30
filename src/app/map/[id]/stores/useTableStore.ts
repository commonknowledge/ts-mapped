"use client";

import { create } from "zustand";

interface TableStore {
  selectedDataSourceId: string;
  tablePage: number;
  toggleDataSourceId: (dataSourceId: string) => void;
  setTablePage: (page: number) => void;
  reset: () => void;
}

export const useTableStore = create<TableStore>((set, get) => ({
  tablePage: 0,
  setTablePage: (page) => {
    set({ tablePage: page });
  },
  selectedDataSourceId: "",
  toggleDataSourceId: (dataSourceId) => {
    const currentId = get().selectedDataSourceId;
    if (currentId === dataSourceId) {
      set({ selectedDataSourceId: "" });
    } else {
      set({ selectedDataSourceId: dataSourceId, tablePage: 0 });
    }
  },
  reset: () => {
    set({ selectedDataSourceId: "", tablePage: 0 });
  },
}));
