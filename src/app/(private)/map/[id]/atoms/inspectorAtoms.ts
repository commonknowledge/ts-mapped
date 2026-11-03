import { atom } from "jotai";
import type {
  InspectorContent,
  SelectedBoundary,
  SelectedRecord,
  SelectedTurf,
} from "@/app/(private)/map/[id]/types/inspector";

export const selectedRecordsAtom = atom<SelectedRecord[]>([]);
export const focusedRecordAtom = atom<SelectedRecord | null>(null);
export const selectedTurfAtom = atom<SelectedTurf | null>(null);
export const selectedBoundaryAtom = atom<SelectedBoundary | null>(null);
export const inspectorContentAtom = atom<InspectorContent | null>(null);
// Collapsed to a compact title bar; selection state is kept while minimized
export const inspectorMinimizedAtom = atom<boolean>(false);
// The data source tab shown in the light editor's inspector; kept as you
// click between areas so you can compare them on the same data
export const inspectorActiveSourceIdAtom = atom<string | null>(null);
