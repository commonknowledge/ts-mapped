"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getBoundaryDatasetName } from "@/app/map/[id]/components/inspector/helpers";
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
import { LayerType } from "@/types";

import type {
  InspectorContent,
  SelectedBoundary,
  SelectedRecord,
  SelectedTurf,
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
  const [selectedRecords, _setSelectedRecords] = useState<SelectedRecord[]>([]);
  const [selectedRecordIndex, setSelectedRecordIndex] = useState(0);
  const [selectedTurf, setSelectedTurf] = useState<SelectedTurf | null>(null);
  const [selectedBoundary, setSelectedBoundary] =
    useState<SelectedBoundary | null>(null);

  const [inspectorContent, setInspectorContent] =
    useState<InspectorContent | null>(null);

  const setSelectedRecords = useCallback((records: SelectedRecord[]) => {
    _setSelectedRecords(records);
    setSelectedRecordIndex(0);
  }, []);

  // Change this by setting the correct index. Not set directly to prevent
  // getting out-of-sync with selectedRecords.
  const selectedRecord: SelectedRecord | null = useMemo(() => {
    return selectedRecords[selectedRecordIndex] || selectedRecords[0] || null;
  }, [selectedRecordIndex, selectedRecords]);

  useEffect(() => {
    // if no selected marker / member to inspect
    if (!selectedRecord || !selectedRecord.properties) {
      // check if area selected
      if (selectedTurf?.id) {
        setInspectorContent({
          type: LayerType.Turf,
          name: selectedTurf.name || "Area",
          properties: null,
          dataSource: null,
        });
      } else if (selectedBoundary?.name) {
        setInspectorContent({
          type: LayerType.Boundary,
          name: selectedBoundary.name,
          dataSource: null,
          properties: {
            ["Area Code"]: selectedBoundary?.areaCode,
            Dataset: getBoundaryDatasetName(selectedBoundary?.sourceLayerId),
          },
        });
      } else {
        setInspectorContent(null);
      }

      return;
    }

    const dataSourceId = selectedRecord.dataSourceId;

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
    selectedTurf,
    selectedBoundary,
    mapConfig.membersDataSourceId,
    selectedRecord,
  ]);

  const resetInspector = useCallback(() => {
    setSelectedRecords([]);
    setSelectedTurf(null);
    setSelectedBoundary(null);
    setInspectorContent(null);
  }, [setSelectedRecords]);

  return (
    <InspectorContext
      value={{
        inspectorContent,
        setInspectorContent,
        selectedRecords,
        setSelectedRecords,
        selectedRecordIndex,
        setSelectedRecordIndex,
        selectedRecord,
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
