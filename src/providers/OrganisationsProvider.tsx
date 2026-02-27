"use client";

import { createContext, useCallback, useState } from "react";
import type { Organisation } from "@/server/models/Organisation";

const STORAGE_KEY = "mapped:organisationId";

function getInitialOrganisationId(
  initialOrganisations: Organisation[],
): string | null {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && initialOrganisations.some((org) => org.id === stored)) {
      return stored;
    }
  }
  return initialOrganisations.length ? initialOrganisations[0].id : null;
}

export const OrganisationsContext = createContext<{
  organisationId: string | null;
  setOrganisationId: (id: string) => void;
}>({
  organisationId: null,
  setOrganisationId: () => {
    return;
  },
});

export default function OrganisationsProvider({
  initialOrganisations,
  children,
}: {
  initialOrganisations: Organisation[];
  children: React.ReactNode;
}) {
  const [organisationId, setOrganisationIdState] = useState<string | null>(() =>
    getInitialOrganisationId(initialOrganisations),
  );

  const setOrganisationId = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setOrganisationIdState(id);
  }, []);

  return (
    <OrganisationsContext.Provider
      value={{ organisationId, setOrganisationId }}
    >
      {children}
    </OrganisationsContext.Provider>
  );
}
