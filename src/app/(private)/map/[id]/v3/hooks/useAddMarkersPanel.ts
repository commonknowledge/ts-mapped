"use client";

import { useAtom } from "jotai";
import { addMarkersPanelOpenAtom } from "../atoms";

export function useAddMarkersPanel() {
  return useAtom(addMarkersPanelOpenAtom);
}
