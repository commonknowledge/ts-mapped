"use client";

import React, { createContext, use, useState } from "react";
import { createStore, useStore } from "zustand";
import type { ReactNode } from "react";

interface TableStore {
  selectedDataSourceId: string;
  tablePage: number;
  toggleDataSourceId: (dataSourceId: string) => void;
  setTablePage: (page: number) => void;
}

type TableStoreApi = ReturnType<typeof createTableStore>;

const createTableStore = () => {
  return createStore<TableStore>((set, get) => ({
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
  }));
};

const TableStoreContext = createContext<TableStoreApi | null>(null);

export function TableStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createTableStore());

  return <TableStoreContext value={store}>{children}</TableStoreContext>;
}

export const useTableStore = <T,>(selector: (state: TableStore) => T): T => {
  const store = use(TableStoreContext);
  if (!store) throw new Error("Missing TableStoreProvider");
  return useStore(store, selector);
};
