"use client";

import Image from "next/image";
import Link from "next/link";
import { useContext, useState } from "react";
import Loading from "@/components/Map/components/Loading";
import Map from "@/components/Map/components/Map";
import { ChoroplethContext } from "@/components/Map/context/ChoroplethContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { MarkerAndTurfContext } from "@/components/Map/context/MarkerAndTurfContext";
import PublishPublicMapSidebar from "./EditorComponents/PublishPublicMapSidebar";
import { PublicMapContext } from "./PublicMapContext";
import { PublicMapListings } from "./PublishedComponents/PublicMapListings";
import PublicMapSidebar from "./PublishedComponents/PublicMapSidebar";
import PublicMapTopBar from "./PublishedComponents/PublicMapTopBar";
import { publicMapColourSchemes } from "@/components/Map/styles";

export default function PublicMap() {
  const { mapQuery } = useContext(MapContext);
  const { editable, colourScheme, dataRecordsQueries } = useContext(PublicMapContext);
  const { areaStatsLoading, areaStatsQuery, setLastLoadedSourceId } =
    useContext(ChoroplethContext);
  const { markerQueries } = useContext(MarkerAndTurfContext);


  if (!mapQuery || mapQuery.loading) {
    return <Loading />;
  }

  const loading =
    areaStatsLoading || areaStatsQuery?.loading || markerQueries?.loading;

  // Convert string colourScheme to actual color scheme object
  const activeColourScheme = colourScheme ?
    (publicMapColourSchemes[colourScheme] || publicMapColourSchemes.red) :
    { primary: "#ef4444", muted: "#fef2f2" };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <PublicMapSidebar />
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden relative flex-1 overflow-hidden">
        {/* Fixed Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <PublicMapTopBar />
        </div>

        {/* Fixed Map - Behind everything */}
        <div className="absolute top-24 left-0 right-0 z-10" style={{ height: 'calc(100vh - 50vh - 6rem)' }}>
          <Map
            onSourceLoad={(sourceId) => setLastLoadedSourceId(sourceId)}
            hideDrawControls={true}
          />
          {loading && <Loading />}
          <Link
            href="https://v3.mapped.tools"
            className="absolute bottom-6 right-4 flex flex-col items-center w-24"
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

        {/* Mobile - Scrollable Listings - Slides over map */}
        <div className="absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-all duration-300 ease-out" style={{ height: '50vh' }}>
          <div className="overflow-y-auto h-full">
            <PublicMapListings />
          </div>
        </div>
      </div>

      {/* Desktop Map Section */}
      <div className="hidden md:block flex-1 relative min-h-0">
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

      {/* Editor Sidebar */}
      {editable && <PublishPublicMapSidebar />}
    </div>
  );
}
