import { atom } from "jotai";
import type { SelectedArea } from "./selectedAreasAtom";

export const selectedSecondaryAreaAtom = atom<SelectedArea | null>(null);
