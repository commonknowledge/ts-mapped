import { useAtom, useSetAtom } from "jotai";
import { useCallback } from "react";
import {
  infoPopupEditingAtom,
  infoPopupOpenAtom,
} from "../atoms/mapStateAtoms";

export function useInfoPopupOpen() {
  return useAtom(infoPopupOpenAtom);
}

export function useInfoPopupEditing() {
  return useAtom(infoPopupEditingAtom);
}

export function useOpenInfoPopup() {
  const setOpen = useSetAtom(infoPopupOpenAtom);
  return useCallback(() => setOpen(true), [setOpen]);
}

export function useOpenInfoPopupEditing() {
  const setOpen = useSetAtom(infoPopupOpenAtom);
  const setEditing = useSetAtom(infoPopupEditingAtom);
  return useCallback(() => {
    setEditing(true);
    setOpen(true);
  }, [setOpen, setEditing]);
}
