import { atom } from "jotai";
import type {
  InspectorContent,
  SelectedBoundary,
  SelectedRecord,
  SelectedTurf,
} from "@/app/map/[id]/types/inspector";

export const selectedRecordsAtom = atom<SelectedRecord[]>([]);
export const focusedRecordAtom = atom<SelectedRecord | null>(null);
export const selectedTurfAtom = atom<SelectedTurf | null>(null);
export const selectedBoundaryAtom = atom<SelectedBoundary | null>(null);
export const inspectorContentAtom = atom<InspectorContent | null>(null);

/** When true, InspectorSettingsModal should be open. Used by layers panel Data section. */
export const inspectorSettingsModalOpenAtom = atom<boolean>(false);
/** When set, InspectorSettingsModal opens with this data source pre-selected. */
export const inspectorSettingsInitialDataSourceIdAtom = atom<string | null>(
  null,
);
/** Which tab to show when opening: "general" (layer/column options) or "inspector". Set by opener (layers vs inspector panel). */
export const inspectorSettingsInitialTabAtom = atom<"general" | "inspector">(
  "general",
);
