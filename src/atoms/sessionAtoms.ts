import { atom, getDefaultStore } from "jotai";
import { useAtomValue, useSetAtom } from "jotai/react";
import type { CurrentUser } from "@/authTypes";

export const currentUserAtom = atom<CurrentUser | null>(null);

const defaultStoreOptions = { store: getDefaultStore() };

export function useCurrentUser() {
  return useAtomValue(currentUserAtom, defaultStoreOptions);
}

export function useSetCurrentUser() {
  return useSetAtom(currentUserAtom, defaultStoreOptions);
}
