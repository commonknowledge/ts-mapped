"use client";

import { useQuery } from "@tanstack/react-query";
import { LoaderPinwheel } from "lucide-react";
import { useContext } from "react";
import { MapsList } from "@/app/(private)/components/MapsList";
import PageHeader from "@/components/PageHeader";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { useTRPC } from "@/services/trpc/react";

export default function DashboardPage() {
  const { organisationId } = useContext(OrganisationsContext);

  const trpc = useTRPC();
  const { data, isPending } = useQuery(
    trpc.publicMap.list.queryOptions(
      { organisationId: organisationId || "" },
      { enabled: Boolean(organisationId) },
    ),
  );

  const mappedData = data?.length
    ? data.map((map) => ({
        ...map,
        href: `/map/${map.mapId}/view/${map.viewId}/publish`,
      }))
    : [];

  return (
    <div>
      <PageHeader title="Public maps" />

      {isPending ? (
        <LoaderPinwheel className="animate-spin" />
      ) : (
        <MapsList maps={mappedData} />
      )}
    </div>
  );
}
