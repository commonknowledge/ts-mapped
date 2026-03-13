"use client";

import { getDefaultStore } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { organisationIdAtom } from "@/atoms/organisationAtoms";
import type { Organisation } from "@/server/models/Organisation";
import type { ReactNode } from "react";

function getInitialOrganisationId(
  organisations: Organisation[],
  storedOrgId: string | null,
): string | null {
  if (storedOrgId && organisations.some((org) => org.id === storedOrgId)) {
    return storedOrgId;
  }
  return organisations.length ? organisations[0].id : null;
}

export default function OrganisationHydrator({
  organisations,
  storedOrgId,
  children,
}: {
  organisations: Organisation[];
  storedOrgId: string | null;
  children: ReactNode;
}) {
  useHydrateAtoms(
    [
      [
        organisationIdAtom,
        getInitialOrganisationId(organisations, storedOrgId),
      ],
    ],
    { store: getDefaultStore() },
  );
  return children;
}
