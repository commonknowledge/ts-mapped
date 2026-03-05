import { useAtom } from "jotai";
import { editColumnMetadataAtom } from "../atoms/editColumnMetadataAtom";

export const useEditColumnMetadataAtom = () => useAtom(editColumnMetadataAtom);
