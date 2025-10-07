"use client";

import { useQueries } from "@tanstack/react-query";
import { useContext, useEffect, useState } from "react";
import { DataSourcesContext } from "@/app/map/[id]/context/DataSourcesContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { SORT_BY_LOCATION, SORT_BY_NAME_COLUMNS } from "@/constants";
import { type RouterOutputs, useTRPC } from "@/services/trpc/react";
import { createDataSourceConfig } from "../components/DataSourcesSelect";
import { PublicMapContext } from "../context/PublicMapContext";
import type {
  PublicMap,
  PublicMapColumn,
  PublicMapDataSourceConfig,
} from "@/__generated__/types";
import type { Point } from "@/server/models/shared";
import type { ReactNode } from "react";

export default function PublicMapProvider({
  publicMap: initialPublicMap,
  editable = false,
  children,
}: {
  publicMap: NonNullable<RouterOutputs["publicMap"]["getPublished"]>;
  editable?: boolean;
  children: ReactNode;
}) {
  const { view } = useContext(MapContext);
  const { publicMap, setPublicMap, activeTabId, setActiveTabId } =
    usePublicMapAndActiveTab(initialPublicMap, editable);
  const [searchLocation, setSearchLocation] = useState<Point | null>(null);

  const [activePublishTab, setActivePublishTab] = useState<string>("settings");
  const [recordSidebarVisible, setRecordSidebarVisible] =
    useState<boolean>(false);
  const [colourScheme, setColourScheme] = useState<string>("red");

  const dataSourceConfigs = publicMap?.dataSourceConfigs || [];
  const trpc = useTRPC();

  const dataRecordsQueryOptions = dataSourceConfigs.map(({ dataSourceId }) => {
    const filter = view?.dataSourceViews.find(
      (dsv) => dsv.dataSourceId === dataSourceId,
    )?.filter;
    const sort = searchLocation
      ? [{ name: SORT_BY_LOCATION, location: searchLocation, desc: false }]
      : [{ name: SORT_BY_NAME_COLUMNS, desc: false }];
    return trpc.dataRecord.list.queryOptions({
      dataSourceId,
      filter,
      sort,
      all: true,
    });
  });

  const dataRecordsQueries = useQueries({
    queries: dataRecordsQueryOptions,
    combine: (results) => {
      return results.reduce(
        (o, result, i) => {
          const dataSourceId = dataSourceConfigs[i].dataSourceId;
          o[dataSourceId] = result;
          return o;
        },
        {} as Record<
          string,
          {
            data: RouterOutputs["dataRecord"]["list"] | undefined;
            isFetching: boolean;
          }
        >,
      );
    },
  });

  const updatePublicMap = (updates: Partial<PublicMap>) => {
    if (publicMap) {
      setPublicMap({ ...publicMap, ...updates });
    }
  };

  const updateDataSourceConfig = (
    dataSourceId: string,
    updates: Partial<PublicMapDataSourceConfig>,
  ) => {
    if (publicMap) {
      setPublicMap({
        ...publicMap,
        dataSourceConfigs: publicMap.dataSourceConfigs.map((dsc) => {
          if (dsc.dataSourceId === dataSourceId) {
            return { ...dsc, ...updates };
          }
          return dsc;
        }),
      });
    }
  };

  const updateAdditionalColumn = (
    dataSourceId: string,
    columnIndex: number,
    updates: Partial<PublicMapColumn>,
  ) => {
    if (publicMap) {
      setPublicMap({
        ...publicMap,
        dataSourceConfigs: publicMap.dataSourceConfigs.map((dsc) => {
          if (dsc.dataSourceId === dataSourceId) {
            return {
              ...dsc,
              additionalColumns: dsc.additionalColumns.map((c, i) => {
                if (i === columnIndex) {
                  return { ...c, ...updates };
                }
                return c;
              }),
            };
          }
          return dsc;
        }),
      });
    }
  };

  return (
    <PublicMapContext
      value={{
        publicMap,
        editable,
        dataRecordsQueries,
        searchLocation,
        setSearchLocation,
        updatePublicMap,
        updateDataSourceConfig,
        updateAdditionalColumn,
        activeTabId,
        setActiveTabId,
        activePublishTab,
        setActivePublishTab,
        recordSidebarVisible,
        setRecordSidebarVisible,
        colourScheme,
        setColourScheme,
      }}
    >
      {children}
    </PublicMapContext>
  );
}

// When loading an editable public map with no data sources,
// update the public map to show all available data sources
const usePublicMapAndActiveTab = (
  initialPublicMap: NonNullable<RouterOutputs["publicMap"]["getPublished"]>,
  editable: boolean,
) => {
  const { mapConfig } = useContext(MapContext);
  const { getDataSourceById } = useContext(DataSourcesContext);

  const [publicMap, setPublicMap] = useState(initialPublicMap);
  const [activeTabId, setActiveTabId] = useState<string | null>(
    publicMap?.dataSourceConfigs?.[0]?.dataSourceId || null,
  );

  useEffect(() => {
    if (!editable || initialPublicMap.dataSourceConfigs.length) {
      return;
    }

    const dataSources = mapConfig
      .getDataSourceIds()
      .map((id) => getDataSourceById(id))
      .filter((ds) => ds !== undefined && ds !== null);

    const dataSourceConfigs = dataSources.map(createDataSourceConfig);

    setPublicMap((prev) => ({ ...prev, dataSourceConfigs }));
    if (dataSourceConfigs.length) {
      setActiveTabId(dataSourceConfigs[0].dataSourceId);
    }
  }, [
    editable,
    getDataSourceById,
    initialPublicMap.dataSourceConfigs.length,
    mapConfig,
  ]);

  return { publicMap, setPublicMap, activeTabId, setActiveTabId };
};
