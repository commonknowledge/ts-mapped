import { atom, getDefaultStore } from "jotai";
import { useAtomValue, useSetAtom } from "jotai/react";

export const organisationIdAtom = atom<string | null>(null);

const defaultStoreOptions = { store: getDefaultStore() };

export function useOrganisationId() {
  return useAtomValue(organisationIdAtom, defaultStoreOptions);
}

export function useSetOrganisationId() {
  return useSetAtom(organisationIdAtom, defaultStoreOptions);
}
