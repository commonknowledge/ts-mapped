import { atom } from "jotai";
import type { LayerType } from "@/types";

export const hiddenLayersAtom = atom<LayerType[]>([]);
