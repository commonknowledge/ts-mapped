"use client";

import { MapIcon } from "lucide-react";
import { useContext } from "react";
import { publicMapColourSchemes } from "@/components/Map/styles";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import PublicMapGeocoder from "@/components/PublicMap/PublicMapGeocoder";
import { cn } from "@/shadcn/utils";
import EditablePublicMapProperty from "../EditorComponents/EditablePublicMapProperty";
import DataRecordSidebar from "./DataRecordSidebar";
import { PublicMapListings } from "./PublicMapListings";

export default function PublicMapSidebar() {
  const {
    publicMap,
    editable,

    setSearchLocation,
    recordSidebarVisible,
    colourScheme,
  } = useContext(PublicMapContext);

  // Convert string colourScheme to actual color scheme object
  const activeColourScheme =
    publicMapColourSchemes[colourScheme] || publicMapColourSchemes.red;

  // Should never happen
  if (!publicMap) {
    return;
  }

  return (
    <div className={cn("absolute top-0 left-0 z-10 bg-white flex md:h-full")}>
      <div className="flex flex-col md:h-full md:w-[300px] border-r border-neutral-200">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-neutral-200">
          <div
            style={{ backgroundColor: activeColourScheme.muted }}
            className="p-4 flex flex-col gap-6"
          >
            <div className="flex flex-col items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapIcon
                  className="w-10 h-10 shrink-0"
                  style={{
                    fill: "white",
                    stroke: activeColourScheme.primary,
                  }}
                />
                <EditablePublicMapProperty
                  property="name"
                  placeholder="Map name"
                >
                  <h1 className="text-2xl font-medium leading-tight text-balance tracking-tight">
                    {publicMap.name}
                  </h1>
                </EditablePublicMapProperty>
              </div>
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
                <p>
                  {publicMap.description || (
                    <span className="text-sm text-neutral-500 italic">
                      Add a description to your map
                    </span>
                  )}
                </p>
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
                    {publicMap.descriptionLink || (
                      <span className="text-sm text-neutral-500 italic">
                        Add a link to your map
                      </span>
                    )}
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
        <div className="hidden md:block">
          <PublicMapListings />
        </div>
      </div>

      {recordSidebarVisible && <DataRecordSidebar />}
    </div>
  );
}
