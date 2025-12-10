import { atom } from "jotai";

export const boundariesPanelOpenAtom = atom<boolean>(false);
export const selectedBivariateBucketAtom = atom<string | null>(null);
export const lastLoadedSourceIdAtom = atom<string | undefined>(undefined);
