import { useAtom } from "jotai";
import { selectedSecondaryAreaAtom } from "../atoms/selectedSecondaryAreaAtom";

export const useSelectedSecondaryArea = () =>
  useAtom(selectedSecondaryAreaAtom);
