"use client";

import { ReactNode, useState } from "react";
import { SortInput } from "@/__generated__/types";
import { TableContext } from "@/app/(private)/map/[id]/context/TableContext";
import { useDataRecordsQuery } from "../data";

const TableProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDataSourceId, setSelectedDataSourceId] = useState<string>("");
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const [tableFilter, setTableFilter] = useState("");
  const [tablePage, setTablePage] = useState(0);
  const [tableSort, setTableSort] = useState<SortInput[]>([]);

  const dataRecordsQuery = useDataRecordsQuery({
    dataSourceId: selectedDataSourceId,
    page: tablePage,
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
