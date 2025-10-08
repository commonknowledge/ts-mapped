"use client";

import { useState } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import type { ReactNode } from "react";

const InspectorProvider = ({ children }: { children: ReactNode }) => {
  const [selectedRecord, setSelectedRecord] = useState<{
    id: string;
    dataSourceId: string;
  } | null>(null);

  return (
    <InspectorContext
      value={{
        selectedRecord,
        setSelectedRecord,
      }}
    >
      {children}
    </InspectorContext>
  );
};

export default InspectorProvider;
