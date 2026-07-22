"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useDataSources } from "@/hooks/useDataSources";
import { useTRPC } from "@/services/trpc/react";
import { useMapViews } from "./useMapViews";
import { useTimelineFilter } from "./useTimelineFilter";

export function useDataRecords(dataSourceId: string, page = 0) {
  const { view } = useMapViews();
  const trpc = useTRPC();
  const { activeRange } = useTimelineFilter();
  const { getDataSourceById } = useDataSources();

  const dataSourceView = useMemo(
    () =>
      view?.dataSourceViews.find((dsv) => dsv.dataSourceId === dataSourceId),
    [dataSourceId, view?.dataSourceViews],
  );

  // The timeline only filters sources with a date column, matching the map
  const timelineRange =
    activeRange && getDataSourceById(dataSourceId)?.columnRoles.dateColumn
      ? activeRange
      : undefined;

  return useQuery(
    trpc.dataRecord.list.queryOptions(
      {
        dataSourceId,
        page,
        search: dataSourceView?.search,
        filter: dataSourceView?.filter,
        sort: dataSourceView?.sort,
        timelineRange,
      },
      {
        enabled: Boolean(dataSourceId),
      },
    ),
  );
}
