"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderPinwheel, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapsList } from "@/app/(private)/components/MapsList";
import PageHeader from "@/components/PageHeader";
import { useOrganisations } from "@/hooks/useOrganisations";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";

export default function DashboardPage() {
  const router = useRouter();
  const { organisationId } = useOrganisations();

  const trpc = useTRPC();
  const { data, isPending } = useQuery(
    trpc.map.list.queryOptions(
      { organisationId: organisationId || "" },
      { enabled: Boolean(organisationId), refetchOnMount: "always" },
    ),
  );

  const mappedData = data?.length
    ? data.map((map) => ({
        ...map,
        href: `/map/${map.id}`,
      }))
    : [];

  const [isLoading, setIsLoading] = useState(false);

  const client = useQueryClient();

  const { mutate: createMap } = useMutation(
    trpc.map.create.mutationOptions({
      onSuccess: (data) => {
        client.invalidateQueries({
          queryKey: trpc.map.byId.queryKey({ mapId: data.id }),
        });
        router.push(`/map/${data.id}`);
      },
      onError: () => {
        setIsLoading(false);
      },
    }),
  );

  const onClickNew = () => {
    if (!organisationId) return;
    setIsLoading(true);
    createMap({ organisationId });
  };

  return (
    <div>
      <PageHeader
        title="Recent maps"
        action={
          <Button
            type="button"
            size="lg"
            onClick={() => onClickNew()}
            disabled={isLoading}
          >
            <PlusIcon /> Add new
          </Button>
        }
      />

      {isPending ? (
        <LoaderPinwheel className="animate-spin" />
      ) : (
        <MapsList maps={mappedData} />
      )}
    </div>
  );
}
