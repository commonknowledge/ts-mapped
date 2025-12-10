import { atom } from "jotai";
import type {
  InspectorContent,
  SelectedBoundary,
  SelectedRecord,
  SelectedTurf,
} from "@/app/map/[id]/context/InspectorContext";

export const selectedRecordsAtom = atom<SelectedRecord[]>([]);
export const focusedRecordAtom = atom<SelectedRecord | null>(null);
export const selectedTurfAtom = atom<SelectedTurf | null>(null);
export const selectedBoundaryAtom = atom<SelectedBoundary | null>(null);
export const inspectorContentAtom = atom<InspectorContent | null>(null);
