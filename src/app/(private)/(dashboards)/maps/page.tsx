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
  const { organisationId, currentOrganisation } = useOrganisations();

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
        variant="hero"
        eyebrow={currentOrganisation?.name}
        title="Maps"
        description="Your organisation's maps of members, places and data. Open one to carry on, start a new one, or learn the editor with a tutorial."
        action={
          tab === MAPS_TABS.maps && (
            <Button
              type="button"
              onClick={() => onClickNew()}
              disabled={isLoading}
            >
              <PlusIcon /> New map
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
        {/* Underlined, like the editor's tabs */}
        <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-neutral-200 bg-transparent p-0">
          {[
            {
              value: MAPS_TABS.maps,
              label: "Your maps",
              count: mappedData.length,
            },
            { value: MAPS_TABS.tutorials, label: "Tutorials" },
          ].map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className="-mb-px h-auto flex-none gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pt-0 pb-2.5 text-sm text-neutral-500 shadow-none hover:text-neutral-900 data-[state=active]:border-ink data-[state=active]:bg-transparent data-[state=active]:text-ink data-[state=active]:shadow-none"
            >
              {item.label}
              {item.count !== undefined && !isPending && (
                <span className="text-xs tabular-nums text-neutral-400">
                  {item.count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={MAPS_TABS.maps}>
          {isPending ? (
            <LoaderPinwheel className="animate-spin text-neutral-400" />
          ) : mappedData.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-14 text-center">
              <p className="font-medium text-ink">No maps yet</p>
              <p className="max-w-sm text-sm text-neutral-500">
                Start a new map, or take the tutorial to build one step by step.
              </p>
            </div>
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
