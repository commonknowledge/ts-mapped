"use client";

import { gql, useQuery } from "@apollo/client";
import { LoaderPinwheel } from "lucide-react";
import { useContext } from "react";
import { ListMapsQuery, ListMapsQueryVariables } from "@/__generated__/types";
import PageHeader from "@/components/PageHeader";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { Separator } from "@/shadcn/ui/separator";
import { MapCard } from "./components/MapCard";

export default function DashboardPage() {
  const { organisationId } = useContext(OrganisationsContext);
  const { data, loading } = useQuery<ListMapsQuery, ListMapsQueryVariables>(
    gql`
      query ListMaps($organisationId: String!) {
        maps(organisationId: $organisationId) {
          id
          name
          createdAt
        }
      }
    `,
    {
      variables: { organisationId: organisationId || "" },
      skip: !organisationId,
    },
  );
  const maps = data?.maps || [];

  return (
    <div className="p-4 mx-auto max-w-6xl w-full">
      <div className="flex items-center justify-between">
        <PageHeader title="Recent" />
      </div>
      <Separator className="my-4" />
      {loading ? (
        <LoaderPinwheel className="animate-spin" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 overflow-y-auto w-full">
          {maps.map(
            ({
              id,
              name,
              createdAt,
            }: {
              id: string;
              name: string;
              createdAt: string;
            }) => (
              <MapCard key={id} id={id} name={name} createdAt={createdAt} />
            ),
          )}
        </div>
      )}
    </div>
  );
}
