"use client";

import { useEffect, useState } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MARKER_NAME_KEY } from "@/constants";
import type {
  InspectorContent,
  SelectedRecord,
} from "@/app/map/[id]/context/InspectorContext";
import type { ReactNode } from "react";

const InspectorProvider = ({ children }: { children: ReactNode }) => {
  const [selectedRecord, setSelectedRecord] = useState<SelectedRecord | null>(
    null,
  );
  const [inspectorContent, setInspectorContent] =
    useState<InspectorContent | null>(null);

  useEffect(() => {
    if (!selectedRecord || !selectedRecord?.properties) {
      setInspectorContent(null);

      return;
    }

    setInspectorContent({
      type: "marker", // TODO: add helper to get actual type
      name: selectedRecord?.properties?.[MARKER_NAME_KEY],
      properties: selectedRecord?.properties, // map properties to show only columns that are shown in the data table
      // TODO: add data source data
    });
  }, [selectedRecord]);

  const resetInspector = () => {
    setSelectedRecord(null);
    setInspectorContent(null);
  };

  return (
    <InspectorContext
      value={{
        inspectorContent,
        setInspectorContent,
        selectedRecord,
        setSelectedRecord,
        resetInspector,
      }}
    >
      {children}
    </InspectorContext>
  );
};

export default InspectorProvider;
