"use client";

import Image from "next/image";

import { useContext } from "react";
import Loading from "@/app/map/[id]/components/Loading";
import Map from "@/app/map/[id]/components/Map";
import { useAreaStats } from "@/app/map/[id]/data";
import { useChoropleth } from "@/app/map/[id]/hooks/useChoropleth";
import { useMapId } from "@/app/map/[id]/hooks/useMapCore";
import { useMapQuery } from "@/app/map/[id]/hooks/useMapQuery";
import { useMarkerQueries } from "@/app/map/[id]/hooks/useMarkerQueries";
import { useIsMobile } from "@/hooks/useIsMobile";
import { PublicMapContext } from "../context/PublicMapContext";
import EditorNavbar from "./editable/EditorNavbar";
import PublishPublicMapSidebar from "./editable/PublishPublicMapSidebar";
import PublicMapSidebar from "./PublicMapSidebar";
import PublicMapTopBarMobile from "./PublicMapTopBarMobile";

export default function PublicMap() {
  const mapId = useMapId();
  const { editable } = useContext(PublicMapContext);
  const areaStatsQuery = useAreaStats();
  const { setLastLoadedSourceId } = useChoropleth();
  const markerQueries = useMarkerQueries();

  const { data: map, isPending } = useMapQuery(mapId);

  const isMobile = useIsMobile();

  if (!map || isPending) {
    return <Loading />;
  }

  const loading = areaStatsQuery?.isFetching || markerQueries?.isFetching;

  const showNavbar = editable;

  return (
    <div
      className="flex flex-col h-screen lg:overflow-hidden"
      style={
        {
          "--navbar-height": showNavbar ? "" : 0,
        } as React.CSSProperties
      }
    >
      {showNavbar && (
        <div className="absolute top-0 left-0 w-full">
          <EditorNavbar />
        </div>
      )}
      <div className="grow flex flex-col md:flex-row">
        {/* Desktop Sidebar - Hidden on mobile */}
        {!isMobile && <PublicMapSidebar />}

        {/* Main Content Area */}
        <div className="flex-1 relative flex flex-col md:block">
          {/* Mobile Top Bar - Hidden on desktop */}
          <div className="md:hidden">
            <PublicMapTopBarMobile />
          </div>

          {/* Map - Full area */}
          <div className="relative grow md:w-full md:h-full">
            <Map
              onSourceLoad={(sourceId) => setLastLoadedSourceId(sourceId)}
              hideDrawControls={true}
            />
            {loading && <Loading />}
            <a
              href="https://mapped.tools"
              target="_blank"
              className="absolute top-4 right-4 flex-col items-center w-24 md:w-auto text-sm text-neutral-500 hidden md:flex"
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
          {isMobile && (
            <div
              className="bg-white border-t relative"
              style={{ height: "50vh" }}
            >
              <div className="overflow-y-auto h-full">
                <PublicMapSidebar />
              </div>
            </div>
          )}

          {/* Editor Sidebar */}
          {editable && <PublishPublicMapSidebar />}
        </div>
      </div>
    </div>
  );
}
