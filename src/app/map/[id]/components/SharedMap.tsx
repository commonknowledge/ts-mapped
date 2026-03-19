"use client";

import {
  useMapBottomPadding,
  useMapMode,
  useSetLastLoadedSourceId,
  useShowNavbar,
} from "../hooks/useMapCore";
import Map from "./Map";

export default function SharedMap() {
  const mapMode = useMapMode();
  const showNavbar = useShowNavbar();
  const mapBottomPadding = useMapBottomPadding();
  const setLastLoadedSourceId = useSetLastLoadedSourceId();

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
