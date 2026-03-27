import { useAtom } from "jotai";
import { getDefaultStore } from "jotai";
import { editColumnMetadataAtom } from "@/atoms/editColumnMetadataAtom";

const defaultStoreOptions = { store: getDefaultStore() };

export const useEditColumnMetadata = () =>
  useAtom(editColumnMetadataAtom, defaultStoreOptions);
