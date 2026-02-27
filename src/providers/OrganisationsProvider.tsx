"use client";

import { createContext, useCallback, useState } from "react";
import { ORGANISATION_COOKIE_NAME } from "@/constants";
import type { Organisation } from "@/server/models/Organisation";

function getInitialOrganisationId(
  organisations: Organisation[],
  storedOrgId: string | null,
): string | null {
  if (storedOrgId && organisations.some((org) => org.id === storedOrgId)) {
    return storedOrgId;
  }
  return organisations.length ? organisations[0].id : null;
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
  organisations,
  storedOrgId,
  children,
}: {
  organisations: Organisation[];
  storedOrgId: string | null;
  children: React.ReactNode;
}) {
  const [organisationId, setOrganisationIdState] = useState<string | null>(() =>
    getInitialOrganisationId(organisations, storedOrgId),
  );
  const setOrganisationId = useCallback((id: string) => {
    document.cookie = `${ORGANISATION_COOKIE_NAME}=${encodeURIComponent(id)}; path=/; max-age=${60 * 60 * 24 * 365}`;
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
