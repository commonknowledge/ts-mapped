"use client";

import { useAtomValue } from "jotai";
import {
  mapBottomPaddingAtom,
  mapModeAtom,
  showNavbarAtom,
} from "../atoms/mapStateAtoms";
import { useChoropleth } from "../hooks/useChoropleth";
import Map from "./Map";

export default function SharedMap() {
  const mapMode = useAtomValue(mapModeAtom);
  const showNavbar = useAtomValue(showNavbarAtom);
  const mapBottomPadding = useAtomValue(mapBottomPaddingAtom);
  const { setLastLoadedSourceId } = useChoropleth();

  const baseClass =
    mapMode === "private"
      ? "absolute inset-0 hidden lg:block"
      : "absolute inset-0";

  const topClass = showNavbar ? "top-[var(--navbar-height)]" : "";

  return (
    <div
      className={`${baseClass} ${topClass}`}
      style={
        mapBottomPadding > 0 ? { bottom: `${mapBottomPadding}px` } : undefined
      }
    >
      <Map onSourceLoad={(sourceId) => setLastLoadedSourceId(sourceId)} />
    </div>
  );
}
