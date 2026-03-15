"use client";

import { useAtomValue } from "jotai";
import { mapModeAtom, showNavbarAtom } from "../atoms/mapStateAtoms";
import { useChoropleth } from "../hooks/useChoropleth";
import Map from "./Map";

export default function SharedMap() {
  const mapMode = useAtomValue(mapModeAtom);
  const showNavbar = useAtomValue(showNavbarAtom);
  const { setLastLoadedSourceId } = useChoropleth();

  const baseClass =
    mapMode === "private"
      ? "absolute inset-0 hidden lg:block"
      : "absolute inset-0";

  const topClass = showNavbar ? "top-[var(--navbar-height)]" : "";

  return (
    <div className={`${baseClass} ${topClass}`}>
      <Map
        onSourceLoad={(sourceId) => setLastLoadedSourceId(sourceId)}
        hideDrawControls={mapMode === "public"}
      />
    </div>
  );
}
