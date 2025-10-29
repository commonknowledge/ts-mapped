import { createContext } from "react";

export const TableContext = createContext<{
  /* State */
  selectedDataSourceId: string;
  setSelectedDataSourceId: (dataSourceId: string) => void;
  handleDataSourceSelect: (dataSourceId: string) => void;

  tablePage: number;
  setTablePage: (page: number) => void;
}>({
  selectedDataSourceId: "",
  setSelectedDataSourceId: () => null,
  handleDataSourceSelect: () => null,
  tablePage: 0,
  setTablePage: () => null,
});
