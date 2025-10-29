"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTRPC } from "@/services/trpc/react";
import { useMapViews } from "./useMapViews";

export function useDataRecords(dataSourceId: string, page = 0) {
  const { view } = useMapViews();
  const trpc = useTRPC();

  const dataSourceView = useMemo(
    () =>
      view?.dataSourceViews.find((dsv) => dsv.dataSourceId === dataSourceId),
    [dataSourceId, view?.dataSourceViews],
  );

  return useQuery(
    trpc.dataRecord.list.queryOptions(
      {
        dataSourceId,
        page,
        search: dataSourceView?.search,
        filter: dataSourceView?.filter,
        sort: dataSourceView?.sort,
      },
      {
        enabled: Boolean(dataSourceId),
        placeholderData: keepPreviousData,
      },
    ),
  );
}
