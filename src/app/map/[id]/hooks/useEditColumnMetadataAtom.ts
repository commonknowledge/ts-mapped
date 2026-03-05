import { useAtom } from "jotai";
import { editColumnMetadataAtom } from "../atoms/editColumnMetadataAtom";

const useEditColumnMetadataAtom = () => useAtom(editColumnMetadataAtom);

export default useEditColumnMetadataAtom;
