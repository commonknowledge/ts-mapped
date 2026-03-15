"use client";

import { useAtomValue } from "jotai";
import { mapModeAtom, showNavbarAtom } from "../atoms/mapStateAtoms";
import { useInitialMapViewEffect } from "../hooks/useInitialMapView";
import { useSyncMapModeToUrl } from "../hooks/useSyncMapModeToUrl";
import { useSyncViewIdToUrl } from "../hooks/useSyncViewIdToUrl";
import PublicMapEditorNavbar from "../publish/components/editable/EditorNavbar";
import PrivateMapNavbar from "./PrivateMapNavbar";

export default function MapNavbar() {
  const showNavbar = useAtomValue(showNavbarAtom);
  const mapMode = useAtomValue(mapModeAtom);

  // Ensure a view is selected (creates a default view if none exist)
  useInitialMapViewEffect();
  // Keep the viewId URL param in sync with the Jotai atom
  useSyncViewIdToUrl();
  // Sync ?mode=publish to the mapMode atom
  useSyncMapModeToUrl();

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
