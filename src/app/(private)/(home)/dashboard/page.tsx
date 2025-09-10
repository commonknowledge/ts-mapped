"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { LoaderPinwheel } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext } from "react";
import PageHeader from "@/components/PageHeader";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { Button } from "@/shadcn/ui/button";
import { useTRPC } from "@/utils/trpc/react";
import { MapCard } from "./components/MapCard";

export default function DashboardPage() {
  const router = useRouter();
  const { organisationId } = useContext(OrganisationsContext);

  const trpc = useTRPC();
  const { data, isPending } = useQuery(
    trpc.map.list.queryOptions(
      { organisationId: organisationId || "" },
      { enabled: Boolean(organisationId) }
    )
  );

  const { mutate: createMap, isPending: createMapLoading } = useMutation(
    trpc.map.create.mutationOptions({
      onSuccess: (data) => {
        router.push(`/map/${data.id}`);
      },
    })
  );

  const onClickNew = () => {
    if (!organisationId) return;
    createMap({ organisationId });
  };

  return (
    <div>
      <PageHeader
        title="Recent Maps"
        action={
          <Button
            type="button"
            onClick={() => onClickNew()}
            disabled={createMapLoading}
          >
            + New
          </Button>
        }
      />

      {isPending ? (
        <LoaderPinwheel className="animate-spin" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 w-full">
          {data?.map((map) => <MapCard key={map.id} map={map} />)}
        </div>
      )}
    </div>
  );
}
