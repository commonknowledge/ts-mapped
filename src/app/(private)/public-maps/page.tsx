"use client";

import { useQuery } from "@tanstack/react-query";
import { LoaderPinwheel, PlusIcon } from "lucide-react";
import { useState } from "react";
import { MapsList } from "@/app/(private)/components/MapsList";
import CreatePublicMapDialog from "@/app/(private)/public-maps/components/CreatePublicMapDialog";
import PageHeader from "@/components/PageHeader";
import { useOrganisations } from "@/hooks/useOrganisations";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";

export default function DashboardPage() {
  const { organisationId } = useOrganisations();
  const [dialogOpen, setDialogOpen] = useState(false);

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
        href: `/map/${map.mapId}?mode=publish`,
      }))
    : [];

  return (
    <div>
      <PageHeader
        title="Public maps"
        action={
          <Button type="button" size="lg" onClick={() => setDialogOpen(true)}>
            <PlusIcon /> Add new
          </Button>
        }
      />

      {isPending ? (
        <LoaderPinwheel className="animate-spin" />
      ) : (
        <MapsList maps={mappedData} />
      )}

      <CreatePublicMapDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
