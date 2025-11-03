"use client";

import { useContext } from "react";
import { publicMapColourSchemes } from "@/app/map/[id]/styles";
import { cn } from "@/shadcn/utils";
import { PublicMapContext } from "../context/PublicMapContext";
import DataRecordSidebar from "./DataRecordSidebar";
import EditablePublicMapProperty from "./editable/EditablePublicMapProperty";
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
        "absolute top-0 left-0 z-10 bg-white flex md:h-full md:pt-[var(--navbar-height)]",
      )}
    >
      <div className="flex flex-col md:h-full md:w-[300px] border-r border-neutral-200">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-neutral-200">
          <div
            style={{ backgroundColor: activeColourScheme.muted }}
            className="p-4 flex flex-col gap-6"
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
                <EditablePublicMapProperty
                  property="descriptionLink"
                  placeholder="submissions@example.com"
                >
                  {publicMap.descriptionLink && (
                    <a
                      className="underline text-sm "
                      style={{
                        color: activeColourScheme.primary,
                      }}
                      href={`mailto:${publicMap.descriptionLink}`}
                      target="_blank"
                      onClick={(e) => editable && e.preventDefault()}
                    >
                      {publicMap.descriptionLink || (
                        <span className="text-sm text-neutral-500 italic">
                          Add a contact email
                        </span>
                      )}
                    </a>
                  )}
                </EditablePublicMapProperty>
              </div>
            ) : publicMap.description || publicMap.descriptionLink ? (
              <div className="flex flex-col gap-4">
                {publicMap.description ? <p>{publicMap.description}</p> : <></>}
                {publicMap.descriptionLink ? (
                  <a
                    href={`mailto:${publicMap.descriptionLink}`}
                    className="underline text-sm"
                    target="_blank"
                    style={{
                      color: activeColourScheme.primary,
                    }}
                  >
                    {publicMap.descriptionLink}
                  </a>
                ) : (
                  <></>
                )}
              </div>
            ) : (
              <></>
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
