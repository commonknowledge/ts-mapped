import { useAtom } from "jotai";
import { drawAtom } from "../atoms/mapStateAtoms";

export const useDraw = () => {
  return useAtom(drawAtom);
};
