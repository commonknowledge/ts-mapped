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

export default function PublicMapSidebar() {
  const {
    publicMap,
    editable,
    dataRecordsQueries,
    setSearchLocation,
    recordSidebarVisible,
    setRecordSidebarVisible,
    activeTabId,
  } = useContext(PublicMapContext);
  const { setSelectedDataRecord } = useContext(DataRecordContext);

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

  const selectedColour = "#FF6B6B";
  const colourScheme = {
    primary: selectedColour,
    muted: selectedColour + "20",
    extraMuted: selectedColour + "7",
  };

  return (
    <div className={cn("absolute top-0 left-0 z-10 bg-white flex h-full")}>
      <div className="flex flex-col h-full w-[300px] border-r border-neutral-200">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-neutral-200">
          <div
            style={{ backgroundColor: colourScheme.muted }}
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
                    color: colourScheme.primary,
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
                      color: colourScheme.primary,
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
              colourScheme={colourScheme}
            />
          </div>
        </div>
        <div className="overflow-y-auto">
          {/* Listings */}
          <div className="p-4 flex items-center justify-between">
            <span className="text-sm font-semibold">
              {Object.values(dataRecordsQueries).reduce((total, query) => {
                return total + (query.data?.dataSource?.records?.length || 0);
              }, 0)}{" "}
              Listings
            </span>
            <div className="flex items-center gap-2">
              {!recordSidebarVisible && (
                <Button variant="outline" size="sm" onClick={openRecordSidebar}>
                  View Details
                </Button>
              )}
              {editable && <DataSourcesSelect />}
            </div>
          </div>
          <DataSourceTabs
            colourScheme={colourScheme}
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
