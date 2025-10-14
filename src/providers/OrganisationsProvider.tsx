"use client";

import { createContext, useCallback, useState } from "react";
import type { Organisation } from "@/server/models/Organisation";

export const OrganisationsContext = createContext<{
  organisations: Organisation[];
  organisationId: string | null;
  setOrganisationId: (id: string) => void;
  getOrganisation: () => Organisation | undefined;
  updateOrganisation: (id: string, update: Partial<Organisation>) => void;
}>({
  organisations: [],
  organisationId: null,
  setOrganisationId: () => {
    return;
  },
  getOrganisation: () => {
    return undefined;
  },
  updateOrganisation: () => null,
});

export default function OrganisationsProvider({
  organisations: initialOrganisations,
  children,
}: {
  organisations: Organisation[];
  children: React.ReactNode;
}) {
  const [organisations, setOrganisations] = useState(initialOrganisations);
  const [organisationId, setOrganisationId] = useState<string | null>(
    organisations.length ? organisations[0].id : null,
  );

  const getOrganisation = useCallback(() => {
    return organisations.find((o) => o.id === organisationId);
  }, [organisations, organisationId]);

  const updateOrganisation = (id: string, update: Partial<Organisation>) => {
    setOrganisations(
      organisations.map((o) => {
        if (o.id === id) {
          return { ...o, ...update };
        } else {
          return o;
        }
      }),
    );
  };

  return (
    <OrganisationsContext
      value={{
        organisations,
        organisationId,
        setOrganisationId,
        getOrganisation,
        updateOrganisation,
      }}
    >
      {children}
    </OrganisationsContext>
  );
}
