"use client";

import { useQuery } from "@tanstack/react-query";
import { AreaSetCode } from "@/models/AreaSet";
import { useTRPC } from "@/services/trpc/react";
import { DataRecordMatchType } from "@/types";
import ConfigurableDataRecordsPanel from "./ConfigurableDataRecordsPanel";
import type { SelectedBoundary } from "../../types/inspector";
import type { Point } from "@/models/shared";

export function LocationDataPanel({
  dataSourceId,
  selectedBoundary,
  markerPoint,
  defaultExpanded,
}: {
  dataSourceId: string;
  selectedBoundary?: SelectedBoundary | null;
  markerPoint?: Point | null;
  defaultExpanded: boolean;
}) {
  const trpc = useTRPC();

  const { data: boundaryData, isLoading: isLoadingBoundary } = useQuery(
    trpc.dataRecord.byAreaCode.queryOptions(
      {
        dataSourceId: dataSourceId,
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
        dataSourceId: dataSourceId,
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
    <ConfigurableDataRecordsPanel
      dataSourceId={dataSourceId}
      records={data?.records ?? []}
      isLoading={isLoading}
      defaultExpanded={defaultExpanded}
      hint={
        data?.match === DataRecordMatchType.Approximate
          ? "Approximate boundary match"
          : ""
      }
    />
  );
}
