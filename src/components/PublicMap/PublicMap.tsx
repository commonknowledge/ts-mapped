"use client";

import { useContext } from "react";
import Loading from "@/components/Map/components/Loading";
import Map from "@/components/Map/components/Map";
import { ChoroplethContext } from "@/components/Map/context/ChoroplethContext";
import { DataSourcesContext } from "@/components/Map/context/DataSourcesContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { MarkerAndTurfContext } from "@/components/Map/context/MarkerAndTurfContext";

export default function PublicMap() {
  const { mapQuery } = useContext(MapContext);
  const { areaStatsLoading, areaStatsQuery, setLastLoadedSourceId } =
    useContext(ChoroplethContext);
  const { dataSourcesLoading } = useContext(DataSourcesContext);
  const { markerQueries } = useContext(MarkerAndTurfContext);

  if (!mapQuery || mapQuery.loading) {
    return <Loading />;
  }

  const loading =
    areaStatsLoading ||
    dataSourcesLoading ||
    areaStatsQuery?.loading ||
    markerQueries?.loading;

  return (
    <>
      <Map onSourceLoad={(sourceId) => setLastLoadedSourceId(sourceId)} />
      {loading && <Loading />}
    </>
  );
}
