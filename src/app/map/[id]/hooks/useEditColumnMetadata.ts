import { useAtom } from "jotai";
import { editColumnMetadataAtom } from "../atoms/editColumnMetadataAtom";

export const useEditColumnMetadata = () => useAtom(editColumnMetadataAtom);
