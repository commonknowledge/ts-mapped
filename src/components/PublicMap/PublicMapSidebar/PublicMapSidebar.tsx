"use client";

import { QueryResult } from "@apollo/client";
import { LoaderPinwheel, PanelLeft } from "lucide-react";
import Image from "next/image";
import { useContext, useState } from "react";
import {
  PublicMapDataRecordsQuery,
  PublicMapDataRecordsQueryVariables,
} from "@/__generated__/types";
import { DataRecordContext } from "@/components/Map/context/DataRecordContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import PublicMapGeocoder from "@/components/PublicMap/PublicMapGeocoder";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import DataRecordSidebar from "./DataRecordSidebar";
import DataSourcesSelect from "./DataSourcesSelect";
import DataSourceTabs from "./DataSourceTabs";
import EditablePublicMapProperty from "./EditablePublicMapProperty";
import { Separator } from "@/shadcn/ui/separator";
import { publicMapColourSchemes } from "@/components/Map/styles";

export default function PublicMapSidebar() {
  const {
    publicMap,
    editable,
    dataRecordsQueries,
    setSearchLocation,
    recordSidebarVisible,
    setRecordSidebarVisible,
    activeTabId,
    colourScheme,
  } = useContext(PublicMapContext);
  const { setSelectedDataRecord } = useContext(DataRecordContext);

  // Convert string colourScheme to actual color scheme object
  const activeColourScheme =
    publicMapColourSchemes[colourScheme] || publicMapColourSchemes.red;

  // Function to open record sidebar and select first record
  const openRecordSidebar = () => {
    setRecordSidebarVisible(true);

    // Select the first record from the active data source
    const currentDataSourceId =
      activeTabId || publicMap?.dataSourceConfigs[0]?.dataSourceId;

    if (currentDataSourceId && dataRecordsQueries[currentDataSourceId]) {
      const firstRecord =
        dataRecordsQueries[currentDataSourceId]?.data?.dataSource?.records?.[0];
      if (firstRecord) {
        setSelectedDataRecord({
          id: firstRecord.id,
          dataSourceId: currentDataSourceId,
        });
      }
    }
  };

  // Should never happen
  if (!publicMap) {
    return;
  }

  const loadingSources = Object.values(dataRecordsQueries).some(
    (q) => q.loading
  );

  return (
    <div className={cn("absolute top-0 left-0 z-10 bg-white flex h-full")}>
      <div className="flex flex-col h-full w-[300px] border-r border-neutral-200">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-neutral-200">
          <div
            style={{ backgroundColor: activeColourScheme.muted }}
            className="p-4 flex flex-col gap-6"
          >
            <div className="flex flex-col items-center justify-between gap-2">
              <Image
                src="/mapped-logo-colours.svg"
                alt="Logo"
                width={400}
                height={200}
              />

              <EditablePublicMapProperty property="name" placeholder="Map name">
                <h1
                  className="text-lg font-medium px-4 p-2 bg-white rounded-full text-balance leading-tight"
                  style={{
                    color: activeColourScheme.primary,
                  }}
                >
                  {publicMap.name}
                </h1>
              </EditablePublicMapProperty>
              {/* <Button
              variant="ghost"
              size="icon"
              onClick={() => setHideSidebar(!hideSidebar)}
              >
              <PanelLeft className="w-4 h-4" />
              <span className="sr-only">Toggle sidebar</span>
              </Button> */}
            </div>
            <div className="flex flex-col gap-1">
              <EditablePublicMapProperty
                property="description"
                placeholder="Map description"
              >
                <p>{publicMap.description}</p>
              </EditablePublicMapProperty>
              <EditablePublicMapProperty
                property="descriptionLink"
                placeholder="https://example.com"
              >
                {publicMap.descriptionLink && (
                  <a
                    className="underline text-sm "
                    style={{
                      color: activeColourScheme.primary,
                    }}
                    href={publicMap.descriptionLink}
                    target="_blank"
                    onClick={(e) => editable && e.preventDefault()}
                  >
                    {publicMap.descriptionLink}
                  </a>
                )}
              </EditablePublicMapProperty>
            </div>
            <PublicMapGeocoder
              onGeocode={(p) => setSearchLocation(p)}
              colourScheme={activeColourScheme}
            />
          </div>
        </div>
        <div className="overflow-y-auto p-4">
          {/* Listings */}

          <DataSourceTabs
            colourScheme={activeColourScheme}
            editable={editable}
            dataRecordsQueries={dataRecordsQueries}
          />
          {loadingSources && (
            <div className="p-4 pt-0">
              <LoaderPinwheel className="animate-spin" />
            </div>
          )}
          {/* No listings */}
          {editable && publicMap.dataSourceConfigs.length === 0 && (
            <div className="flex flex-col gap-2 p-2 border border-neutral-200 rounded-md border-dashed">
              <p className="text-sm text-neutral-500">
                No data sources added yet. Add a data source to get started.
              </p>
            </div>
          )}
        </div>
      </div>

      {recordSidebarVisible && <DataRecordSidebar />}
    </div>
  );
}
