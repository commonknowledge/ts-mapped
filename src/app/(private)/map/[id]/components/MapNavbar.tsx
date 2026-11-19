"use client";

import { useInitialMapViewEffect } from "../hooks/useInitialMapView";
import { useMapRoute } from "../hooks/useMapCore";
import { useSyncMapRouteToUrlEffect } from "../hooks/useSyncMapRouteToUrl";
import { useSyncViewIdToUrlEffect } from "../hooks/useSyncViewIdToUrl";
import PublicMapEditorNavbar from "../publish/components/editable/EditorNavbar";
import PrivateMapNavbar from "./PrivateMapNavbar";

export default function MapNavbar() {
  const route = useMapRoute();

  // Ensure a view is selected (creates a default view if none exist)
  useInitialMapViewEffect();
  // Keep the viewId URL param in sync with the Jotai atom
  useSyncViewIdToUrlEffect();
  // Sync ?mode=publish to the map route atom
  useSyncMapRouteToUrlEffect();

  if (route === "publish") {
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
