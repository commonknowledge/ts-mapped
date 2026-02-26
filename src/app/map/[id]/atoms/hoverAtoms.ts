import { atom } from "jotai";
import type { AreaSetCode } from "@/server/models/AreaSet";

export const hoverAreaAtom = atom<{
  areaSetCode: AreaSetCode;
  code: string;
  name: string;
  coordinates: [number, number];
} | null>(null);

export const hoverSecondaryAreaAtom = atom<{
  areaSetCode: AreaSetCode;
  code: string;
  name: string;
  coordinates: [number, number];
} | null>(null);

export const hoverMarkerAtom = atom<{
  coordinates: [number, number];
  properties: Record<string, unknown>;
} | null>(null);
