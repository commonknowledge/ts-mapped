"use client";

import { useContext, useEffect, useState } from "react";
import { DataSourcesContext } from "@/app/map/[id]/context/DataSourcesContext";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import {
  MARKER_DATA_SOURCE_ID_KEY,
  MARKER_EXTERNAL_ID_KEY,
  MARKER_ID_KEY,
  MARKER_MATCHED_KEY,
  MARKER_NAME_KEY,
  MARKER_RADIUS_KEY,
  MAX_COLUMN_KEY,
  SORT_BY_LOCATION,
  SORT_BY_NAME_COLUMNS,
} from "@/constants";
import { LayerType } from "@/types";

import type {
  InspectorContent,
  SelectedRecord,
  SelectedTurf,
} from "@/app/map/[id]/context/InspectorContext";
import type { ReactNode } from "react";

const HIDDEN_PROPERTIES = [
  MARKER_ID_KEY,
  MARKER_DATA_SOURCE_ID_KEY,
  MARKER_EXTERNAL_ID_KEY,
  MARKER_NAME_KEY,
  MARKER_MATCHED_KEY,
  MARKER_RADIUS_KEY,
  MAX_COLUMN_KEY,
  SORT_BY_LOCATION,
  SORT_BY_NAME_COLUMNS,
];

const InspectorProvider = ({ children }: { children: ReactNode }) => {
  const { getDataSourceById } = useContext(DataSourcesContext);
  const { mapConfig } = useContext(MapContext);
  const [selectedRecord, setSelectedRecord] = useState<SelectedRecord | null>(
    null,
  );
  const [selectedTurf, setSelectedTurf] = useState<SelectedTurf | null>(null);

  const [inspectorContent, setInspectorContent] =
    useState<InspectorContent | null>(null);

  useEffect(() => {
    if (!selectedRecord || !selectedRecord?.properties) {
      if (selectedTurf?.id) {
        setInspectorContent({
          type: LayerType.Turf,
          name: selectedTurf.name || "Area",
          properties: null,
          dataSource: null,
        });
      } else {
        setInspectorContent(null);
      }

      return;
    }

    const dataSourceId = selectedRecord?.dataSourceId;

    const dataSource = dataSourceId ? getDataSourceById(dataSourceId) : null;
    const type =
      dataSourceId === mapConfig.membersDataSourceId
        ? LayerType.Member
        : LayerType.Marker;

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
  }, [
    getDataSourceById,
    selectedRecord,
    selectedTurf,
    mapConfig.membersDataSourceId,
  ]);

  const resetInspector = () => {
    setSelectedRecord(null);
    setSelectedTurf(null);
    setInspectorContent(null);
  };

  return (
    <InspectorContext
      value={{
        inspectorContent,
        setInspectorContent,
        selectedRecord,
        setSelectedRecord,
        selectedTurf,
        setSelectedTurf,
        resetInspector,
      }}
    >
      {children}
    </InspectorContext>
  );
};

export default InspectorProvider;
