import { atom } from "jotai";

export interface EditColumnMetadataFields {
  description?: boolean;
  valueLabels?: boolean;
  valueColors?: boolean;
  // Opens the same colour/order section as valueColors; use when the caller
  // cares about the drag-reorderable value order (e.g. the size ramp)
  valueOrder?: boolean;
}

export const editColumnMetadataAtom = atom<{
  dataSourceId: string;
  column: string;
  fields: EditColumnMetadataFields;
} | null>(null);
