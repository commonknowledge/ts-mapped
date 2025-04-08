"use client";

import { createContext, useState } from "react";
import { Organisation } from "@/__generated__/types";

export const OrganisationsContext = createContext<{
  organisations: Organisation[];
  organisationId: string | null;
  setOrganisationId: (id: string) => void;
}>({
  organisations: [],
  organisationId: null,
  setOrganisationId: () => {
    return;
  },
});

export default function OrganisationsProvider({
  organisations,
  children,
}: {
  organisations: Organisation[];
  children: React.ReactNode;
}) {
  const [organisationId, setOrganisationId] = useState<string | null>(
    organisations.length ? organisations[0].id : null,
  );
  return (
    <OrganisationsContext
      value={{ organisations, organisationId, setOrganisationId }}
    >
      {children}
    </OrganisationsContext>
  );
}
