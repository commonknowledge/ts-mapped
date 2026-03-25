import { atom } from "jotai";

export interface EditColumnMetadataFields {
  description?: boolean;
  valueLabels?: boolean;
  colorMappings?: boolean;
}

export const editColumnMetadataAtom = atom<{
  dataSourceId: string;
  column: string;
  fields: EditColumnMetadataFields;
} | null>(null);
