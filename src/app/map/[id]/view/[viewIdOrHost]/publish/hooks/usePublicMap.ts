import { useAtomValue, useSetAtom } from "jotai";
import {
  activePublishTabAtom,
  activeTabIdAtom,
  colorSchemeAtom,
  editableAtom,
  publicMapAtom,
  searchLocationAtom,
  updateAdditionalColumnAtom,
  updateDataSourceConfigAtom,
  updatePublicMapAtom,
} from "../atoms/publicMapAtoms";

// Granular read hooks
export function usePublicMapValue() {
  return useAtomValue(publicMapAtom);
}

export function useEditable() {
  return useAtomValue(editableAtom);
}

export function useSearchLocation() {
  return useAtomValue(searchLocationAtom);
}

export function useSetSearchLocation() {
  return useSetAtom(searchLocationAtom);
}

export function useActiveTabId() {
  return useAtomValue(activeTabIdAtom);
}

export function useSetActiveTabId() {
  return useSetAtom(activeTabIdAtom);
}

export function useActivePublishTab() {
  return useAtomValue(activePublishTabAtom);
}

export function useSetActivePublishTab() {
  return useSetAtom(activePublishTabAtom);
}

export function useColorScheme() {
  return useAtomValue(colorSchemeAtom);
}

// Write hooks
export function useUpdatePublicMap() {
  return useSetAtom(updatePublicMapAtom);
}

export function useUpdateDataSourceConfig() {
  return useSetAtom(updateDataSourceConfigAtom);
}

export function useUpdateAdditionalColumn() {
  return useSetAtom(updateAdditionalColumnAtom);
}

export function useSetPublicMap() {
  return useSetAtom(publicMapAtom);
}
