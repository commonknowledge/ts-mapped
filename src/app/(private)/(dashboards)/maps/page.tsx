"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderPinwheel, PlusIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { TUTORIAL_MAP_NAME } from "@/constants";
import { useOrganisations } from "@/hooks/useOrganisations";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import PrivateMapNavbarControls from "../../map/[id]/components/PrivateMapNavbarControls";
import { MapsList } from "../components/MapsList";
import TutorialsList from "./components/TutorialsList";
import { MAPS_TABS } from "./constants";

// The tab is read from the URL, which needs a Suspense boundary
export default function DashboardPage() {
  return (
    <Suspense>
      <MapsPage />
    </Suspense>
  );
}

function MapsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab =
    searchParams.get("tab") === MAPS_TABS.tutorials
      ? MAPS_TABS.tutorials
      : MAPS_TABS.maps;
  const { organisationId } = useOrganisations();

  const trpc = useTRPC();
  const { data, isPending } = useQuery(
    trpc.map.list.queryOptions(
      { organisationId: organisationId || "" },
      { enabled: Boolean(organisationId), refetchOnMount: "always" },
    ),
  );

  // Tutorial maps live under Tutorials, not among your own maps
  const isTutorialMap = (map: NonNullable<typeof data>[number]) =>
    Boolean(map.config.tutorial) || map.name === TUTORIAL_MAP_NAME;
  const mappedData = (data ?? [])
    .filter((map) => !isTutorialMap(map))
    .map((map) => ({ ...map, href: `/map/${map.id}` }));
  const latestTutorialMap = (data ?? [])
    .filter(isTutorialMap)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

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
        title="Maps"
        action={
          tab === MAPS_TABS.maps && (
            <Button
              type="button"
              size="lg"
              onClick={() => onClickNew()}
              disabled={isLoading}
            >
              <PlusIcon /> Add new
            </Button>
          )
        }
      />

      <Tabs
        value={tab}
        onValueChange={(value) =>
          router.replace(
            value === MAPS_TABS.tutorials
              ? `${pathname}?tab=${MAPS_TABS.tutorials}`
              : pathname,
          )
        }
        className="gap-6"
      >
        <TabsList>
          <TabsTrigger value={MAPS_TABS.maps}>Your maps</TabsTrigger>
          <TabsTrigger value={MAPS_TABS.tutorials}>Tutorials</TabsTrigger>
        </TabsList>

        <TabsContent value={MAPS_TABS.maps}>
          {isPending ? (
            <LoaderPinwheel className="animate-spin" />
          ) : (
            <MapsList
              maps={mappedData}
              renderControls={(map, onMenuToggle) => (
                <PrivateMapNavbarControls
                  mapId={map.id}
                  onMenuToggle={onMenuToggle}
                />
              )}
            />
          )}
        </TabsContent>

        <TabsContent value={MAPS_TABS.tutorials}>
          <TutorialsList
            existingTutorialMapId={latestTutorialMap?.id ?? null}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
