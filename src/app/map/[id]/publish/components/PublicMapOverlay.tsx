"use client";

import Image from "next/image";

import Loading from "@/app/map/[id]/components/Loading";
import Map from "@/app/map/[id]/components/Map";
import { useAreaStats } from "@/app/map/[id]/data";
import {
  useMapId,
  useSetLastLoadedSourceId,
} from "@/app/map/[id]/hooks/useMapCore";
import { useMapQuery } from "@/app/map/[id]/hooks/useMapQuery";
import { useMarkerQueries } from "@/app/map/[id]/hooks/useMarkerQueries";
import { useIsMobileEffect } from "@/hooks/useIsMobile";
import { useEditable } from "../hooks/usePublicMap";
import PublishControls from "./editable/PublishControls";
import PublishPublicMapSidebar from "./editable/PublishPublicMapSidebar";
import PublicMapSidebar from "./PublicMapSidebar";
import PublicMapTopBarMobile from "./PublicMapTopBarMobile";

export default function PublicMapOverlay({
  standalone = false,
}: {
  standalone?: boolean;
}) {
  const mapId = useMapId();
  const editable = useEditable();
  const areaStatsQuery = useAreaStats();
  const setLastLoadedSourceId = useSetLastLoadedSourceId();
  const markerQueries = useMarkerQueries();

  const { data: map, isPending } = useMapQuery(mapId);

  const isMobile = useIsMobileEffect();

  if (!map || isPending) {
    return <Loading />;
  }

  const loading = areaStatsQuery?.isFetching || markerQueries?.isFetching;

  return (
    <div
      className={`flex flex-col lg:overflow-hidden ${
        standalone ? "h-screen" : "h-full"
      }`}
      style={
        standalone
          ? ({ "--navbar-height": 0 } as React.CSSProperties)
          : undefined
      }
    >
      <div className="grow flex flex-col md:flex-row">
        {/* Desktop Sidebar - Hidden on mobile */}
        {!isMobile && (
          <div className={standalone ? "" : "pointer-events-auto"}>
            <PublicMapSidebar />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 relative flex flex-col md:block">
          {/* Mobile Top Bar - Hidden on desktop */}
          <div
            className={`md:hidden ${standalone ? "" : "pointer-events-auto"}`}
          >
            <PublicMapTopBarMobile />
          </div>

          {/* Map area */}
          <div className="relative grow md:w-full md:h-full">
            {standalone && (
              <Map
                onSourceLoad={(sourceId) => setLastLoadedSourceId(sourceId)}
              />
            )}
            {loading && <Loading />}
            {editable && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
                <PublishControls />
              </div>
            )}
            <a
              href="https://mapped.tools"
              target="_blank"
              className={`absolute top-4 right-4 flex-col items-center w-24 md:w-auto text-sm text-neutral-500 hidden md:flex ${
                standalone ? "" : "pointer-events-auto"
              }`}
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
              className={`bg-white border-t relative ${
                standalone ? "" : "pointer-events-auto"
              }`}
              style={{ height: "50vh" }}
            >
              <div className="overflow-y-auto h-full">
                <PublicMapSidebar />
              </div>
            </div>
          )}

          {/* Editor Sidebar */}
          {editable && (
            <div className="pointer-events-auto">
              <PublishPublicMapSidebar />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
