import { createContext } from "react";
import type { RouterOutputs } from "@/services/trpc/react";

export const TableContext = createContext<{
  /* State */
  selectedDataSourceId: string;
  setSelectedDataSourceId: (dataSourceId: string) => void;
  handleDataSourceSelect: (dataSourceId: string) => void;

  tablePage: number;
  setTablePage: (page: number) => void;

  /* GraphQL Queries */
  dataRecordsQuery: {
    isPending: boolean;
    data: RouterOutputs["dataRecord"]["list"] | undefined;
  } | null;
}>({
  selectedDataSourceId: "",
  setSelectedDataSourceId: () => null,
  handleDataSourceSelect: () => null,
  tablePage: 0,
  setTablePage: () => null,
  dataRecordsQuery: null,
});
