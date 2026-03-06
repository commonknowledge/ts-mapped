import { atom } from "jotai";

export const editColumnMetadataAtom = atom<{
  dataSourceId: string;
  column: string;
  valueLabelsOnly?: boolean;
} | null>(null);
