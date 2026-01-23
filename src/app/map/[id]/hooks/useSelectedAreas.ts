import { useAtom } from "jotai";
import { selectedAreasAtom } from "../atoms/selectedAreasAtom";

export const useSelectedAreas = () => useAtom(selectedAreasAtom);
