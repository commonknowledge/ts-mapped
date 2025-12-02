"use client";

import { createContext } from "react";
import type { BoundingBox } from "@/server/models/Area";

export const MapBoundsContext = createContext<{
  /* State */
  boundingBox: BoundingBox | null;
  setBoundingBox: (boundingBox: BoundingBox | null) => void;
}>({
  boundingBox: null,
  setBoundingBox: () => null,
});
