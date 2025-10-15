"use client";

import { useContext, useEffect, useState } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
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
import { LayerType } from "@/types";

import type {
  InspectorContent,
  SelectedRecord,
  SelectedTurf,
  SelectedBoundary,
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
  const { turfs } = useContext(MarkerAndTurfContext);
  const [selectedRecord, setSelectedRecord] = useState<SelectedRecord | null>(
    null,
  );
  const [selectedTurf, setSelectedTurf] = useState<SelectedTurf | null>(null);
  const [selectedBoundary, setSelectedBoundary] = useState<SelectedBoundary | null>(null);

  const [inspectorContent, setInspectorContent] =
    useState<InspectorContent | null>(null);

  useEffect(() => {
    if (!selectedRecord || !selectedRecord?.properties) {
      if (selectedTurf?.id) {
        // Find the full turf data to show detailed information
        const turf = turfs?.find(t => t.id === selectedTurf.id);
        setInspectorContent({
          type: LayerType.Turf,
          name: selectedTurf.name || "Area",
          properties: turf ? {
            area: `${turf.area?.toFixed(2)} m²`,
            notes: turf.notes || "No notes",
            created: turf.createdAt.toLocaleDateString(),
          } : null,
          dataSource: null,
        });
      } else if (selectedBoundary?.id) {
        // Restore boundary inspector content
        setInspectorContent({
          type: LayerType.Boundary,
          name: selectedBoundary.name || "Boundary",
          properties: selectedBoundary.properties,
          dataSource: null,
        });
      } else {
        setInspectorContent(null);
      }

      return;
    }

    const dataSourceId = selectedRecord?.dataSourceId;

    // Skip automatic inspector content setting for placed markers (no dataSourceId)
    // These are handled manually in the Map component click handler
    if (!dataSourceId) {
      return;
    }

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
    selectedBoundary,
    mapConfig.membersDataSourceId,
    turfs,
  ]);

  const resetInspector = () => {
    setSelectedRecord(null);
    setSelectedTurf(null);
    setSelectedBoundary(null);
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
        selectedBoundary,
        setSelectedBoundary,
        resetInspector,
      }}
    >
      {children}
    </InspectorContext>
  );
};

export default InspectorProvider;
