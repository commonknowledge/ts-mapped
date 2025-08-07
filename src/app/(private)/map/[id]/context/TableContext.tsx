import { QueryResult } from "@apollo/client";
import { createContext } from "react";
import {
  DataRecordsQuery,
  DataRecordsQueryVariables,
  FilterType,
  RecordFilterInput,
  SortInput,
} from "@/__generated__/types";

export const TableContext = createContext<{
  /* State */
  selectedDataSourceId: string;
  handleDataSourceSelect: (dataSourceId: string) => void;

  selectedRecordId: string | null;
  setSelectedRecordId: (recordId: string | null) => void;

  tableFilter: RecordFilterInput;
  setTableFilter: (filter: RecordFilterInput) => void;
  tableSearch: string;
  setTableSearch: (search: string) => void;
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
  tableFilter: { type: FilterType.MULTI },
  setTableFilter: () => null,
  tableSearch: "",
  setTableSearch: () => null,
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
