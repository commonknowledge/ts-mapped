import { atom } from "jotai";

export interface SelectedArea {
  areaSetCode: string;
  code: string;
  name: string;
  coordinates: [number, number];
}

export const selectedAreasAtom = atom<SelectedArea[]>([]);
