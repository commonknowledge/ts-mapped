import { atom } from "jotai";
import type { AreaSetCode } from "@/server/models/AreaSet";

export interface SelectedArea {
  areaSetCode: AreaSetCode;
  code: string;
  name: string;
  coordinates: [number, number];
}

export const selectedAreasAtom = atom<SelectedArea[]>([]);
