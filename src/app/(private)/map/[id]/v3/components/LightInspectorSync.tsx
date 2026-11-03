"use client";

import { useInspectorLayers } from "../../hooks/useInspectorLayers";

// Keeps the inspector's sections in line with the Areas list. Mounted once.
export default function LightInspectorSync() {
  useInspectorLayers({ sync: true });
  return null;
}
