"use client";

import { useState } from "react";
import { DataRecordContext } from "@/app/map/[id]/context/DataRecordContext";
import type { ReactNode } from "react";

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
