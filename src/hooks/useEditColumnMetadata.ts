import { useAtom } from "jotai";
import { getDefaultStore } from "jotai";
import { editColumnMetadataAtom } from "@/atoms/editColumnMetadataAtom";

// This atom is used in both the map editor (which has its own Jotai Provider)
// and the superadmin context. Explicitly targeting the default store ensures the
// atom is shared across both contexts regardless of which Provider is in the tree.
const defaultStoreOptions = { store: getDefaultStore() };

export const useEditColumnMetadata = () =>
  useAtom(editColumnMetadataAtom, defaultStoreOptions);
