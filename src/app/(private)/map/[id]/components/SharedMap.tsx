"use client";

import {
  useMapBottomPadding,
  useMapRoute,
  useSetLastLoadedSourceId,
  useShowNavbar,
} from "../hooks/useMapCore";
import { isPublicMapLayout } from "../utils/mapRoute";
import Map from "./Map";

export default function SharedMap() {
  const route = useMapRoute();
  const showNavbar = useShowNavbar();
  const mapBottomPadding = useMapBottomPadding();
  const setLastLoadedSourceId = useSetLastLoadedSourceId();

  const baseClass =
    // Like the editor, the shared map is desktop-only
    !isPublicMapLayout(route)
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
