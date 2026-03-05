import { atom } from "jotai";

export const editColumnMetadataAtom = atom<{
  dataSourceId: string;
  column: string;
} | null>(null);
