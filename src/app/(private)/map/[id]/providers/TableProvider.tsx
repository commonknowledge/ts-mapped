"use client";

import { ReactNode, useState } from "react";
import {
  FilterType,
  RecordFilterInput,
  SortInput,
} from "@/__generated__/types";
import { TableContext } from "@/app/(private)/map/[id]/context/TableContext";
import { useDataRecordsQuery } from "../data";

const TableProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDataSourceId, setSelectedDataSourceId] = useState<string>("");
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const [tableFilter, setTableFilter] = useState<RecordFilterInput>({
    type: FilterType.MULTI,
  });
  const [tablePage, setTablePage] = useState(0);
  const [tableSearch, setTableSearch] = useState("");
  const [tableSort, setTableSort] = useState<SortInput[]>([]);

  const dataRecordsQuery = useDataRecordsQuery({
    dataSourceId: selectedDataSourceId,
    page: tablePage,
    search: tableSearch,
    filter: tableFilter,
    sort: tableSort,
  });

  const handleDataSourceSelect = (dataSourceId: string) => {
    if (selectedDataSourceId === dataSourceId) {
      setSelectedDataSourceId("");
      return;
    }
    setSelectedDataSourceId(dataSourceId);
  };

  return (
    <TableContext
      value={{
        tableFilter,
        setTableFilter,
        tablePage,
        setTablePage,
        tableSearch,
        setTableSearch,
        tableSort,
        setTableSort,

        selectedDataSourceId,
        handleDataSourceSelect,
        selectedRecordId,
        setSelectedRecordId,

        dataRecordsQuery,
      }}
    >
      {children}
    </TableContext>
  );
};

export default TableProvider;
