import { atom } from "jotai";
import type { BoundingBox } from "@/server/models/Area";

export const boundingBoxAtom = atom<BoundingBox | null>(null);
