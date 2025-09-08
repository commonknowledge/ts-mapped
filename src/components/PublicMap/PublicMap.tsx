"use client";

import Image from "next/image";
import { useContext, useEffect, useRef } from "react";
import Loading from "@/components/Map/components/Loading";
import Map from "@/components/Map/components/Map";
import { ChoroplethContext } from "@/components/Map/context/ChoroplethContext";
import { DataSourcesContext } from "@/components/Map/context/DataSourcesContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { MarkerAndTurfContext } from "@/components/Map/context/MarkerAndTurfContext";
import { Link } from "../Link";
import EditorNavbar from "./EditorComponents/EditorNavbar";
import PublishPublicMapSidebar from "./EditorComponents/PublishPublicMapSidebar";
import { PublicMapContext } from "./PublicMapContext";
import { createDataSourceConfig } from "./PublishedComponents/DataSourcesSelect";
import { PublicMapListings } from "./PublishedComponents/PublicMapListings";
import PublicMapSidebar from "./PublishedComponents/PublicMapSidebar";
import PublicMapTopBarMobile from "./PublishedComponents/PublicMapTopBarMobile";

export default function PublicMap() {
  const { mapQuery } = useContext(MapContext);
  const { editable } = useContext(PublicMapContext);
  const { areaStatsLoading, areaStatsQuery, setLastLoadedSourceId } =
    useContext(ChoroplethContext);
  const { markerQueries } = useContext(MarkerAndTurfContext);

  usePopulateInitialPublicMap();

  if (!mapQuery || mapQuery.loading) {
    return <Loading />;
  }

  const loading =
    areaStatsLoading || areaStatsQuery?.loading || markerQueries?.loading;

  const showNavbar = editable;

  return (
    <div
      className="flex flex-col h-screen"
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

// When loading an editable, unpublished public map with no data sources,
// update the public map to show all available data sources
const usePopulateInitialPublicMap = () => {
  const pristine = useRef(true);
  const { getDataSourceById } = useContext(DataSourcesContext);
  const { mapConfig } = useContext(MapContext);
  const { editable, publicMap, updatePublicMap } = useContext(PublicMapContext);

  const dataSources = mapConfig
    .getDataSourceIds()
    .map((id) => getDataSourceById(id))
    .filter((ds) => ds !== undefined && ds !== null);

  useEffect(() => {
    const ready =
      editable && publicMap && dataSources.length > 0 && pristine.current;
    if (ready) {
      pristine.current = false;

      if (!publicMap.published && publicMap.dataSourceConfigs.length === 0) {
        const dataSourceConfigs = dataSources.map((ds) =>
          createDataSourceConfig(ds),
        );

        updatePublicMap({ dataSourceConfigs });
      }
    }
  }, [dataSources, editable, publicMap, updatePublicMap]);
};
