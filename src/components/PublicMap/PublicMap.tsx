"use client";

import Image from "next/image";
import Link from "next/link";
import { useContext } from "react";
import Loading from "@/components/Map/components/Loading";
import Map from "@/components/Map/components/Map";
import { ChoroplethContext } from "@/components/Map/context/ChoroplethContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { MarkerAndTurfContext } from "@/components/Map/context/MarkerAndTurfContext";
import PublishPublicMapSidebar from "./EditorComponents/PublishPublicMapSidebar";
import { PublicMapContext } from "./PublicMapContext";
import { PublicMapListings } from "./PublishedComponents/PublicMapListings";
import PublicMapSidebar from "./PublishedComponents/PublicMapSidebar";

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
    <div className="flex flex-col md:flex-row h-screen">
      <PublicMapSidebar />

      <div className="grow relative">
        <Map
          onSourceLoad={(sourceId) => setLastLoadedSourceId(sourceId)}
          hideDrawControls={true}
        />
        {loading && <Loading />}
        <Link
          href="https://v3.mapped.tools"
          className="absolute bottom-6 right-4 flex flex-col items-center w-24 md:w-auto"
        >
          <p className="text-sm text-neutral-500">Made using Mapped</p>
          <Image
            src="/mapped-logo-colours.svg"
            alt="Logo"
            width={200}
            height={200}
          />
        </Link>
      </div>
      <div className="md:hidden block h-1/2">
        <PublicMapListings />
      </div>
      {editable && <PublishPublicMapSidebar />}
    </div>
  );
}
