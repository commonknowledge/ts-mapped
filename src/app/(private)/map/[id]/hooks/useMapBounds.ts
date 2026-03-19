"use client";

import { useAtom } from "jotai";
import { boundingBoxAtom } from "../atoms/mapBoundsAtoms";

export function useMapBounds() {
  const [boundingBox, setBoundingBox] = useAtom(boundingBoxAtom);
  return { boundingBox, setBoundingBox };
}
