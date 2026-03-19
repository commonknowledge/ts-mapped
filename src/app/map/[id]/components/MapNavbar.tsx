"use client";

import { useInitialMapViewEffect } from "../hooks/useInitialMapView";
import { useMapMode, useShowNavbar } from "../hooks/useMapCore";
import { useSyncMapModeToUrlEffect } from "../hooks/useSyncMapModeToUrl";
import { useSyncViewIdToUrlEffect } from "../hooks/useSyncViewIdToUrl";
import PublicMapEditorNavbar from "../publish/components/editable/EditorNavbar";
import PrivateMapNavbar from "./PrivateMapNavbar";

export default function MapNavbar() {
  const showNavbar = useShowNavbar();
  const mapMode = useMapMode();

  // Ensure a view is selected (creates a default view if none exist)
  useInitialMapViewEffect();
  // Keep the viewId URL param in sync with the Jotai atom
  useSyncViewIdToUrlEffect();
  // Sync ?mode=publish to the mapMode atom
  useSyncMapModeToUrlEffect();

  if (!showNavbar) return null;

  if (mapMode === "public") {
    return (
      <div className="pointer-events-auto">
        <PublicMapEditorNavbar />
      </div>
    );
  }

  return (
    <div className="pointer-events-auto">
      <PrivateMapNavbar />
    </div>
  );
}
