"use client";

import { ReactNode, useState } from "react";
import { DataRecordContext } from "@/components/Map/context/DataRecordContext";

const DataRecordProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDataRecord, setSelectedDataRecord] = useState<{
    id: string;
    dataSourceId: string;
  } | null>(null);

  return (
    <DataRecordContext
      value={{
        selectedDataRecord,
        setSelectedDataRecord,
      }}
    >
      {children}
    </DataRecordContext>
  );
};

export default DataRecordProvider;
