"use client";

import { gql, useApolloClient, useMutation, useQuery } from "@apollo/client";
import { LoaderPinwheel } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import {
  CreateMapMutation,
  CreateMapMutationVariables,
  ListMapsQuery,
  ListMapsQueryVariables,
  Map,
} from "@/__generated__/types";
import PageHeader from "@/components/PageHeader";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import MultiRouteTour from "@/tours/MultiRouteTour";
import { useMultiRouteTour } from "@/tours/useMultiRouteTour";
import { MapCard } from "./components/MapCard";
import { LIST_MAPS_QUERY } from "./queries";

export default function DashboardPage() {
  const router = useRouter();

  const { startTour, active, setRun, setStepIndex, setActive } =
    useMultiRouteTour();
  // Reset tour state on page load
  useEffect(() => {
    setRun(false);
    setStepIndex(0);
    setActive(false);
  }, [setRun, setStepIndex, setActive]);
  const apolloClient = useApolloClient();
  const { organisationId } = useContext(OrganisationsContext);
  const [createMapLoading, setCreateMapLoading] = useState(false);
  const { data, loading } = useQuery<ListMapsQuery, ListMapsQueryVariables>(
    LIST_MAPS_QUERY,
    {
      variables: { organisationId: organisationId || "" },
      skip: !organisationId,
      fetchPolicy: "network-only",
    }
  );
  const maps = data?.maps || [];

  // Start multi-route tour if data is loaded and there are no maps
  useEffect(() => {
    if (!loading && maps.length === 0 && !active) {
      startTour();
    }
  }, [loading, maps.length, startTour, active]);

  const [createMap] = useMutation<
    CreateMapMutation,
    CreateMapMutationVariables
  >(gql`
    mutation CreateMap($organisationId: String!) {
      createMap(organisationId: $organisationId) {
        code
        result {
          id
        }
      }
    }
  `);

  const onClickNew = async () => {
    if (!organisationId) {
      return;
    }
    // Manually set loading state to remain `true` while router.push() is running
    setCreateMapLoading(true);
    const response = await createMap({ variables: { organisationId } });
    if (response?.data?.createMap?.result?.id) {
      // Clear the cached result for ListMaps so the new map appears
      // Simpler than manually inserting the new map into the cache
      apolloClient.cache.evict({
        id: "ROOT_QUERY",
        fieldName: "maps",
        args: { organisationId },
      });
      router.push(`/map/${response.data.createMap.result.id}`);
    } else {
      setCreateMapLoading(false);
    }
  };

  return (
    <div className="">
      <span
        id="dashboard-tour-start"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1,
          height: 1,
          pointerEvents: "none",
        }}
      />
      <div className="flex items-center justify-between">
        <PageHeader title="Recent Maps" />
        <Button
          type="button"
          onClick={() => onClickNew()}
          disabled={createMapLoading}
          id="joyride-recent-maps-button-new-map"
        >
          + New
        </Button>
      </div>
      <Separator className="my-4" />
      {loading ? (
        <LoaderPinwheel className="animate-spin" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 w-full">
          {maps.map((map: Map) => (
            <MapCard key={map.id} map={map} />
          ))}
        </div>
      )}
    </div>
  );
}
