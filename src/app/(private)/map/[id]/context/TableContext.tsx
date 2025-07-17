import { QueryResult } from "@apollo/client";
import { createContext } from "react";
import {
  DataRecordsQuery,
  DataRecordsQueryVariables,
  SortInput,
} from "@/__generated__/types";

export const TableContext = createContext<{
  /* State */
  selectedDataSourceId: string;
  handleDataSourceSelect: (dataSourceId: string) => void;

  selectedRecordId: string | null;
  setSelectedRecordId: (recordId: string | null) => void;

  tableFilter: string;
  setTableFilter: (filter: string) => void;
  tablePage: number;
  setTablePage: (page: number) => void;
  tableSort: SortInput[];
  setTableSort: (tableSort: SortInput[]) => void;

  /* GraphQL Queries */
  dataRecordsQuery: QueryResult<
    DataRecordsQuery,
    DataRecordsQueryVariables
  > | null;
}>({
  tableFilter: "",
  setTableFilter: () => null,
  tablePage: 0,
  setTablePage: () => null,
  tableSort: [],
  setTableSort: () => null,
  selectedDataSourceId: "",
  handleDataSourceSelect: () => null,
  selectedRecordId: null,
  setSelectedRecordId: () => null,
  dataRecordsQuery: null,
});
