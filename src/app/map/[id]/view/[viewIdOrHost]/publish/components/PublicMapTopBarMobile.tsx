"use client";

import { useContext } from "react";
import { publicMapColourSchemes } from "@/app/map/[id]/styles";
import { PublicMapContext } from "../context/PublicMapContext";
import PublicMapDescriptionDialog from "./PublicMapDescriptionDialog";
import PublicMapGeocoder from "./PublicMapGeocoder";

export default function PublicMapTopBarMobile() {
  const { publicMap, setSearchLocation, colourScheme } =
    useContext(PublicMapContext);

  // Convert string colourScheme to actual color scheme object
  const activeColourScheme =
    publicMapColourSchemes[colourScheme] || publicMapColourSchemes.red;

  if (!publicMap) {
    return null;
  }

  return (
    <div className="border-b bg-white">
      <div
        className="flex flex-col gap-3 px-3 py-3"
        style={{ backgroundColor: activeColourScheme.muted }}
      >
        <h1 className="text-xl font-medium leading-tight text-balance tracking-tight truncate">
          {publicMap.name}
        </h1>

        {Boolean(publicMap.description) && (
          <p className="text-sm">{publicMap.description}</p>
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
          className="w-full pl-10 pr-4 py-2  bg-white border border-neutral-300 rounded-lg text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}
