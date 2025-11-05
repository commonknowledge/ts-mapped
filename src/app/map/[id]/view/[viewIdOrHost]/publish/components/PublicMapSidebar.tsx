"use client";

import { useContext } from "react";
import { publicMapColourSchemes } from "@/app/map/[id]/styles";
import { cn } from "@/shadcn/utils";
import { PublicMapContext } from "../context/PublicMapContext";
import DataRecordSidebar from "./DataRecordSidebar";
import EditablePublicMapProperty from "./editable/EditablePublicMapProperty";
import PublicMapDescriptionDialog from "./PublicMapDescriptionDialog";
import PublicMapGeocoder from "./PublicMapGeocoder";
import { PublicMapListings } from "./PublicMapListings";

export default function PublicMapSidebar() {
  const { publicMap, editable, setSearchLocation, colourScheme } =
    useContext(PublicMapContext);

  // Convert string colourScheme to actual color scheme object
  const activeColourScheme =
    publicMapColourSchemes[colourScheme] || publicMapColourSchemes.red;

  // Should never happen
  if (!publicMap) {
    return;
  }

  return (
    <div
      className={cn(
        "absolute top-0 left-0 z-100 bg-white flex md:h-full md:pt-[var(--navbar-height)]",
      )}
    >
      <div className="flex flex-col md:h-full md:w-[300px] border-r border-neutral-200">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-neutral-200">
          <div
            style={{ backgroundColor: activeColourScheme.muted }}
            className="p-4 flex flex-col gap-4"
          >
            <div className="flex flex-col w-full items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <EditablePublicMapProperty
                  property="name"
                  placeholder="Map name"
                >
                  <h1 className="text-2xl font-medium leading-tight text-balance tracking-tight">
                    {publicMap.name}
                  </h1>
                </EditablePublicMapProperty>
              </div>
            </div>
            {editable ? (
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
              </div>
            ) : publicMap.description ? (
              <p className="text-sm">{publicMap.description}</p>
            ) : (
              <></>
            )}

            {(Boolean(publicMap.descriptionLong) ||
              Boolean(publicMap.descriptionLink)) && (
              <PublicMapDescriptionDialog
                contactLink={publicMap.descriptionLink}
                description={publicMap.descriptionLong}
              />
            )}

            <PublicMapGeocoder
              onGeocode={(p) => setSearchLocation(p)}
              colourScheme={activeColourScheme}
            />
          </div>
        </div>
        <PublicMapListings />
      </div>

      <DataRecordSidebar />
    </div>
  );
}
