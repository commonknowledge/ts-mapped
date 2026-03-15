"use client";

import Image from "next/image";

import Loading from "@/app/map/[id]/components/Loading";
import { useAreaStats } from "@/app/map/[id]/data";
import { useMapId } from "@/app/map/[id]/hooks/useMapCore";
import { useMapQuery } from "@/app/map/[id]/hooks/useMapQuery";
import { useMarkerQueries } from "@/app/map/[id]/hooks/useMarkerQueries";
import { useSetMapMode } from "@/app/map/[id]/hooks/useSetMapMode";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useEditable } from "../hooks/usePublicMap";
import EditorNavbar from "./editable/EditorNavbar";
import PublishPublicMapSidebar from "./editable/PublishPublicMapSidebar";
import PublicMapSidebar from "./PublicMapSidebar";
import PublicMapTopBarMobile from "./PublicMapTopBarMobile";

export default function PublicMap({
  viewId,
  mapId: mapIdProp,
  editable: editableProp = false,
}: {
  viewId?: string;
  mapId?: string;
  editable?: boolean;
}) {
  useSetMapMode("public", viewId, mapIdProp, editableProp);

  const mapId = useMapId();
  const editable = useEditable();
  const areaStatsQuery = useAreaStats();
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
        <div className="absolute top-0 left-0 w-full pointer-events-auto z-20">
          <EditorNavbar />
        </div>
      )}
      <div className="grow flex flex-col md:flex-row">
        {/* Desktop Sidebar - Hidden on mobile */}
        {!isMobile && (
          <div className="pointer-events-auto">
            <PublicMapSidebar />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 relative flex flex-col md:block">
          {/* Mobile Top Bar - Hidden on desktop */}
          <div className="md:hidden pointer-events-auto">
            <PublicMapTopBarMobile />
          </div>

          {/* Map - Full area (rendered by shared layout, shows through) */}
          <div className="relative grow md:w-full md:h-full">
            {loading && <Loading />}
            <a
              href="https://mapped.tools"
              target="_blank"
              className="pointer-events-auto absolute top-4 right-4 flex-col items-center w-24 md:w-auto text-sm text-neutral-500 hidden md:flex"
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
              className="bg-white border-t relative pointer-events-auto"
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
