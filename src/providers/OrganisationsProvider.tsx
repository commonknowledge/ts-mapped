"use client";

import { createContext, useCallback, useEffect, useState } from "react";
import type { Organisation } from "@/__generated__/types";

export const OrganisationsContext = createContext<{
  organisations: Organisation[];
  organisationId: string | null;
  setOrganisationId: (id: string) => void;
  getOrganisation: () => Organisation | undefined;
}>({
  organisations: [],
  organisationId: null,
  setOrganisationId: () => {
    return;
  },
  getOrganisation: () => {
    return undefined;
  },
});

export default function OrganisationsProvider({
  organisations,
  children,
}: {
  organisations: Organisation[];
  children: React.ReactNode;
}) {
  const [organisationId, setOrganisationId] = useState<string | null>(null);

  useEffect(() => {
    if (organisations.length && !organisationId) {
      setOrganisationId(organisations[0].id);
    }
  }, [organisationId, organisations]);

  const getOrganisation = useCallback(() => {
    return organisations.find((o) => o.id === organisationId);
  }, [organisations, organisationId]);

  return (
    <OrganisationsContext
      value={{
        organisations,
        organisationId,
        setOrganisationId,
        getOrganisation,
      }}
    >
      {children}
    </OrganisationsContext>
  );
}
