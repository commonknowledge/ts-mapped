"use client";

import { useCallback, useEffect, useState } from "react";
import { getBoundaryDatasetName } from "@/app/map/[id]/components/inspector/helpers";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { LayerType } from "@/types";

import type {
  InspectorContent,
  SelectedBoundary,
  SelectedRecord,
  SelectedTurf,
} from "@/app/map/[id]/context/InspectorContext";
import type { ReactNode } from "react";

const InspectorProvider = ({ children }: { children: ReactNode }) => {
  const { getDataSourceById } = useDataSources();
  const { mapConfig } = useMapConfig();
  const [selectedRecord, setSelectedRecord] = useState<SelectedRecord | null>(
    null,
  );
  const [selectedTurf, setSelectedTurf] = useState<SelectedTurf | null>(null);
  const [selectedBoundary, setSelectedBoundary] =
    useState<SelectedBoundary | null>(null);

  const [inspectorContent, setInspectorContent] =
    useState<InspectorContent | null>(null);

  useEffect(() => {
    // if no selected marker / member to inspect
    if (!selectedRecord) {
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

    const dataSourceId = selectedRecord?.dataSourceId;

    const dataSource = dataSourceId ? getDataSourceById(dataSourceId) : null;
    const type =
      dataSourceId === mapConfig.membersDataSourceId
        ? LayerType.Member
        : LayerType.Marker;

    setInspectorContent({
      type: type,
      name: selectedRecord.name,
      properties: {},
      dataSource: dataSource,
    });
  }, [
    getDataSourceById,
    selectedRecord,
    selectedTurf,
    selectedBoundary,
    mapConfig.membersDataSourceId,
  ]);

  const resetInspector = useCallback(() => {
    setSelectedRecord(null);
    setSelectedTurf(null);
    setSelectedBoundary(null);
    setInspectorContent(null);
  }, []);

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
