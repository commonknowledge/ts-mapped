import { atom } from "jotai";

// The light editor's Add markers panel, next to the Layers panel
export const addMarkersPanelOpenAtom = atom(false);

// Data source whose inspector section is open in the edit panel
export const inspectorEditingDataSourceIdAtom = atom<string | null>(null);

// The guided tour's current step, or null when it isn't running
export const tourStepIndexAtom = atom<number | null>(null);
