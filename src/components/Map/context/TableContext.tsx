import { createContext } from "react";
import type {
  DataRecordsQuery,
  DataRecordsQueryVariables,
} from "@/__generated__/types";
import type { QueryResult } from "@apollo/client";

export const TableContext = createContext<{
  /* State */
  selectedDataSourceId: string;
  handleDataSourceSelect: (dataSourceId: string) => void;

  selectedRecordId: string | null;
  setSelectedRecordId: (recordId: string | null) => void;

  tablePage: number;
  setTablePage: (page: number) => void;

  /* GraphQL Queries */
  dataRecordsQuery: QueryResult<
    DataRecordsQuery,
    DataRecordsQueryVariables
  > | null;
}>({
  selectedDataSourceId: "",
  handleDataSourceSelect: () => null,
  selectedRecordId: null,
  setSelectedRecordId: () => null,
  tablePage: 0,
  setTablePage: () => null,
  dataRecordsQuery: null,
});
