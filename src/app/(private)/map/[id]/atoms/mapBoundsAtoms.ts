import { atom } from "jotai";
import type { BoundingBox } from "@/models/Area";

export const boundingBoxAtom = atom<BoundingBox | null>(null);
