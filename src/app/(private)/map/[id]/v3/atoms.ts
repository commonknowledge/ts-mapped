import { atom } from "jotai";

// The light editor's Add markers panel, next to the Layers panel
export const addMarkersPanelOpenAtom = atom(false);

// The inspector's in-place Customise mode
export const inspectorCustomisingAtom = atom(false);

// Data source whose inspector section is open in the edit panel
export const inspectorEditingDataSourceIdAtom = atom<string | null>(null);
