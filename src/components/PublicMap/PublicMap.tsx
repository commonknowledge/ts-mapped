"use client";

import { useContext } from "react";
import Loading from "@/components/Map/components/Loading";
import Map from "@/components/Map/components/Map";
import { ChoroplethContext } from "@/components/Map/context/ChoroplethContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { MarkerAndTurfContext } from "@/components/Map/context/MarkerAndTurfContext";
import { PublicMapContext } from "./PublicMapContext";
import PublicMapSidebar from "./PublicMapSidebar/PublicMapSidebar";
import PublishPublicMapSidebar from "./PublicMapSidebar/PublishPublicMapSidebar";

export default function PublicMap() {
  const { mapQuery } = useContext(MapContext);
  const { editable } = useContext(PublicMapContext);
  const { areaStatsLoading, areaStatsQuery, setLastLoadedSourceId } =
    useContext(ChoroplethContext);
  const { markerQueries } = useContext(MarkerAndTurfContext);

  if (!mapQuery || mapQuery.loading) {
    return <Loading />;
  }

  const loading =
    areaStatsLoading || areaStatsQuery?.loading || markerQueries?.loading;

  return (
    <div className="flex flex-col h-screen">
      <PublicMapSidebar />
      <div className="grow relative">
        <Map
          onSourceLoad={(sourceId) => setLastLoadedSourceId(sourceId)}
          hideDrawControls={true}
        />
        {loading && <Loading />}
      </div>
      {editable && <PublishPublicMapSidebar />}
    </div>
  );
}
