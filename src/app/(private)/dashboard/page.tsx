"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
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

export default function DashboardPage() {
  const router = useRouter();
  const { organisationId } = useContext(OrganisationsContext);
  const [createMapLoading, setCreateMapLoading] = useState(false);
  const { data, loading } = useQuery<ListMapsQuery, ListMapsQueryVariables>(
    gql`
      query ListMaps($organisationId: String!) {
        maps(organisationId: $organisationId) {
          id
          name
          createdAt
          imageUrl
        }
      }
    `,
    {
      variables: { organisationId: organisationId || "" },
      skip: !organisationId,
      fetchPolicy: "network-only",
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
