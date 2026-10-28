"use client";

import { useEffect } from "react";
import { useSetMarkerAppearance } from "../../hooks/useMarkerAppearance";

// Opts this map's Jotai scope into the light editor's map styling
export default function LightEditorSetup() {
  const setMarkerAppearance = useSetMarkerAppearance();

  useEffect(() => {
    setMarkerAppearance("ring");
  }, [setMarkerAppearance]);

  return null;
}
