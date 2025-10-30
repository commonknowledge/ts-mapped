"use client";

import Image from "next/image";
import { useContext } from "react";
import Loading from "@/app/map/[id]/components/Loading";
import Map from "@/app/map/[id]/components/Map";
import { ChoroplethContext } from "@/app/map/[id]/context/ChoroplethContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { useAreaStats } from "@/app/map/[id]/data";
import { useMapQuery } from "@/app/map/[id]/hooks/useMapQuery";
import { useMarkerQueries } from "@/app/map/[id]/hooks/useMarkerQueries";
import { PublicMapContext } from "../context/PublicMapContext";
import EditorNavbar from "./editable/EditorNavbar";
import PublishPublicMapSidebar from "./editable/PublishPublicMapSidebar";
import { PublicMapListings } from "./PublicMapListings";
import PublicMapSidebar from "./PublicMapSidebar";
import PublicMapTopBarMobile from "./PublicMapTopBarMobile";

export default function PublicMap() {
  const { mapId } = useContext(MapContext);
  const { editable } = useContext(PublicMapContext);
  const areaStatsQuery = useAreaStats();
  const { setLastLoadedSourceId } = useContext(ChoroplethContext);
  const markerQueries = useMarkerQueries();

  const { data: map, isPending } = useMapQuery(mapId);

  if (!map || isPending) {
    return <Loading />;
  }

  const loading = areaStatsQuery?.isFetching || markerQueries?.isFetching;

  const showNavbar = editable;

  return (
    <div
      className="flex flex-col h-screen lg:overflow-hidden"
      style={
        showNavbar ? {} : ({ "--navbar-height": 0 } as React.CSSProperties)
      }
    >
      {showNavbar && (
        <div className="absolute top-0 left-0 w-full">
          <EditorNavbar />
        </div>
      )}
      <div className="grow flex flex-col md:flex-row">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden md:block">
          <PublicMapSidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 relative">
          {/* Mobile Top Bar - Hidden on desktop */}
          <div className="md:hidden absolute top-0 left-0 right-0 z-20">
            <PublicMapTopBarMobile />
          </div>

          {/* Map - Full area */}
          <div className="w-full h-full">
            <Map
              onSourceLoad={(sourceId) => setLastLoadedSourceId(sourceId)}
              hideDrawControls={true}
            />
            {loading && <Loading />}
            <a
              href="https://mapped.tools"
              target="_blank"
              className="absolute top-4 right-4 flex flex-col items-center w-24 md:w-auto text-sm text-neutral-500"
            >
              Made using Mapped
              <Image
                src="/mapped-logo-colours.svg"
                alt="Logo"
                width={200}
                height={200}
              />
            </a>
          </div>

          {/* Mobile Listings - Overlay on bottom half */}
          <div
            className="md:hidden absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-2xl shadow-2xl"
            style={{ height: "50vh" }}
          >
            <div className="overflow-y-auto h-full">
              <PublicMapListings />
            </div>
          </div>

          {/* Editor Sidebar */}
          {editable && <PublishPublicMapSidebar />}
        </div>
      </div>
    </div>
  );
}
