"use client";

import { gql, useApolloClient, useMutation, useQuery } from "@apollo/client";
import { LoaderPinwheel } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import {
  CreateMapMutation,
  CreateMapMutationVariables,
  ListMapsQuery,
  ListMapsQueryVariables,
} from "@/__generated__/types";
import PageHeader from "@/components/PageHeader";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import { MapCard } from "./components/MapCard";
import { LIST_MAPS_QUERY } from "./queries";

export default function DashboardPage() {
  const router = useRouter();
  const apolloClient = useApolloClient();
  const { organisationId } = useContext(OrganisationsContext);
  const [createMapLoading, setCreateMapLoading] = useState(false);
  const { data, loading } = useQuery<ListMapsQuery, ListMapsQueryVariables>(
    LIST_MAPS_QUERY,
    {
      variables: { organisationId: organisationId || "" },
      skip: !organisationId,
    },
  );
  const maps = data?.maps || [];
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
      <div className="flex items-center justify-between">
        <PageHeader title="Recent Maps" />
        <Button
          type="button"
          onClick={() => onClickNew()}
          disabled={createMapLoading}
        >
          + New
        </Button>
      </div>
      <Separator className="my-4" />
      {loading ? (
        <LoaderPinwheel className="animate-spin" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 w-full">
          {maps.map((map) => (
            <MapCard key={map.id} map={map} />
          ))}
        </div>
      )}
    </div>
  );
}
