"use client";

import { useContext, useState } from "react";
import Loading from "@/components/Map/components/Loading";
import Map from "@/components/Map/components/Map";
import { ChoroplethContext } from "@/components/Map/context/ChoroplethContext";
import { DataSourcesContext } from "@/components/Map/context/DataSourcesContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { MarkerAndTurfContext } from "@/components/Map/context/MarkerAndTurfContext";
import PublicMapSidebar from "./PublicMapSidebar";

export default function PublicMap() {
  const { mapQuery } = useContext(MapContext);
  const { areaStatsLoading, areaStatsQuery, setLastLoadedSourceId } =
    useContext(ChoroplethContext);
  const { dataSourcesLoading } = useContext(DataSourcesContext);
  const { markerQueries } = useContext(MarkerAndTurfContext);
  const [showControls, setShowControls] = useState(true);

  if (!mapQuery || mapQuery.loading) {
    return <Loading />;
  }

  const loading =
    areaStatsLoading ||
    dataSourcesLoading ||
    areaStatsQuery?.loading ||
    markerQueries?.loading;

  return (
    <div className="flex flex-col h-screen">
      <PublicMapSidebar
        showControls={showControls}
        setShowControls={setShowControls}
      />
      <div className="grow relative">
        <Map
          onSourceLoad={(sourceId) => setLastLoadedSourceId(sourceId)}
          hideDrawControls={true}
        />
        {loading && <Loading />}
      </div>
    </div>
  );
}
