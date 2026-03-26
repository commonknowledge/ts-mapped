"use client";

import { useQuery } from "@tanstack/react-query";
import { AreaSetCode } from "@/models/AreaSet";
import { useTRPC } from "@/services/trpc/react";
import { DataRecordMatchType } from "@/types";
import ConfiguredDataPanel from "./ConfiguredDataPanel";
import type { SelectedBoundary } from "../../types/inspector";
import type { InspectorDataSourceConfig } from "@/models/MapView";
import type { Point } from "@/models/shared";

export function LocationDataPanel({
  config,
  selectedBoundary,
  markerPoint,
  defaultExpanded,
}: {
  config: InspectorDataSourceConfig;
  selectedBoundary?: SelectedBoundary | null;
  markerPoint?: Point | null;
  defaultExpanded: boolean;
}) {
  const trpc = useTRPC();

  const { data: boundaryData, isLoading: isLoadingBoundary } = useQuery(
    trpc.dataRecord.byAreaCode.queryOptions(
      {
        dataSourceId: config.dataSourceId,
        areaCode: selectedBoundary?.code || "",
        areaSetCode: selectedBoundary?.areaSetCode ?? AreaSetCode.WMC24,
      },
      {
        enabled: Boolean(selectedBoundary),
      },
    ),
  );

  const { data: pointData, isLoading: isLoadingPoint } = useQuery(
    trpc.dataRecord.byPoint.queryOptions(
      {
        dataSourceId: config.dataSourceId,
        point: markerPoint || { lat: 0, lng: 0 },
      },
      {
        enabled: Boolean(markerPoint),
      },
    ),
  );

  const isLoading = isLoadingBoundary || isLoadingPoint;
  const data = boundaryData || pointData;

  return (
    <>
      {data?.match === DataRecordMatchType.Approximate && (
        <p className="text-sm text-muted-foreground mb-2 italic">
          Approximate boundary match
        </p>
      )}
      <ConfiguredDataPanel
        config={config}
        records={data?.records ?? []}
        isLoading={isLoading}
        defaultExpanded={defaultExpanded}
      />
    </>
  );
}
