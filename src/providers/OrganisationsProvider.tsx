"use client";

import { createContext, useState } from "react";
import type { Organisation } from "@/server/models/Organisation";

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
  const [organisationId, setOrganisationId] = useState<string | null>(
    initialOrganisations.length ? initialOrganisations[0].id : null,
  );

  return (
    <OrganisationsContext.Provider
      value={{ organisationId, setOrganisationId }}
    >
      {children}
    </OrganisationsContext.Provider>
  );
}
