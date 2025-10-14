"use client";

import { useEffect, useState } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import {
  MARKER_DATA_SOURCE_ID_KEY,
  MARKER_ID_KEY,
  MARKER_MATCHED_KEY,
  MARKER_NAME_KEY,
  MARKER_RADIUS_KEY,
  MAX_COLUMN_KEY,
  SORT_BY_LOCATION,
  SORT_BY_NAME_COLUMNS,
} from "@/constants";

import type {
  InspectorContent,
  SelectedRecord,
} from "@/app/map/[id]/context/InspectorContext";
import type { ReactNode } from "react";

const HIDDEN_PROPERTIES = [
  MARKER_ID_KEY,
  MARKER_DATA_SOURCE_ID_KEY,
  MARKER_NAME_KEY,
  MARKER_MATCHED_KEY,
  MARKER_RADIUS_KEY,
  MAX_COLUMN_KEY,
  SORT_BY_LOCATION,
  SORT_BY_NAME_COLUMNS,
];

const InspectorProvider = ({ children }: { children: ReactNode }) => {
  const { getDataSourceById } = useDataSources();
  const { mapConfig } = useMapConfig();
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

    const dataSourceId = selectedRecord?.dataSourceId;

    const dataSource = dataSourceId ? getDataSourceById(dataSourceId) : null;
    const type =
      dataSourceId === mapConfig.membersDataSourceId ? "member" : "marker";

    const filteredProperties = Object.fromEntries(
      Object.entries(selectedRecord.properties).filter(
        ([key]) => !HIDDEN_PROPERTIES.includes(key),
      ),
    );

    setInspectorContent({
      type: type,
      name: selectedRecord?.properties?.[MARKER_NAME_KEY],
      properties: filteredProperties,
      dataSource: dataSource,
    });
  }, [getDataSourceById, selectedRecord, mapConfig.membersDataSourceId]);

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
