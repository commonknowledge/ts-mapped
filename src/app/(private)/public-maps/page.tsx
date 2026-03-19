"use client";

import { useQuery } from "@tanstack/react-query";
import { LoaderPinwheel, PlusIcon } from "lucide-react";
import { useState } from "react";
import { MapsList } from "@/app/(private)/components/MapsList";
import CreatePublicMapDialog from "@/app/(private)/public-maps/components/CreatePublicMapDialog";
import PublicMapCardControls from "@/app/(private)/public-maps/components/PublicMapCardControls";
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
      { enabled: Boolean(organisationId), refetchOnMount: "always" },
    ),
  );

  const mappedData = data?.length
    ? data
        .filter((map) => map.published || map.listed)
        .map((map) => ({
          ...map,
          publicMapId: map.id,
          isDraft: map.listed && !map.published,
          href: `/map/${map.mapId}?viewId=${map.viewId}&mode=publish`,
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
        <MapsList
          maps={mappedData}
          renderControls={(map, onMenuToggle) => {
            const typedMap = map as (typeof mappedData)[number];
            return (
              <div className="flex items-center gap-2">
                {typedMap.isDraft && (
                  <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                    Draft
                  </span>
                )}
                <PublicMapCardControls
                  publicMapId={typedMap.publicMapId}
                  onMenuToggle={onMenuToggle}
                />
              </div>
            );
          }}
        />
      )}

      <CreatePublicMapDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
