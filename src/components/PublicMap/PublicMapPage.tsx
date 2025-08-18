import { gql } from "@apollo/client";
import {
  PublishedPublicMapQuery,
  PublishedPublicMapQueryVariables,
} from "@/__generated__/types";
import MapProviders from "@/components/Map/MapProviders";
import { DEV_NEXT_PUBLIC_BASE_URL } from "@/constants";
import { getClient } from "@/services/apollo";
import PublicMap from "./PublicMap";
import PublicMapProvider from "./PublicMapProvider";

export default async function PublicMapPage({ host }: { host: string }) {
  const apolloClient = await getClient();
  const publicMapQuery = await apolloClient.query<
    PublishedPublicMapQuery,
    PublishedPublicMapQueryVariables
  >({
    query: gql`
      query PublishedPublicMap($host: String!) {
        publishedPublicMap(host: $host) {
          id
          mapId
          viewId
          name
          description
          descriptionLink
          dataSourceConfigs {
            dataSourceId
            nameColumns
            nameLabel
            descriptionColumn
            descriptionLabel
            additionalColumns {
              label
              sourceColumns
              type
            }
          }
        }
      }
    `,
    variables: { host },
  });
  if (!publicMapQuery.data.publishedPublicMap) {
    return (
      <div className="h-dvh w-full flex flex-col items-center gap-4 pt-40">
        <h1 className="font-bold text-2xl">Map not found</h1>
        <p>
          Sorry, this map is not available right now.{" "}
          <a
            className="underline"
            href={process.env.NEXT_PUBLIC_BASE_URL || DEV_NEXT_PUBLIC_BASE_URL}
          >
            Visit Mapped
          </a>
        </p>
      </div>
    );
  }
  const publicMap = publicMapQuery.data.publishedPublicMap;
  return (
    <MapProviders
      mapId={publicMap.mapId}
      viewId={publicMap.viewId}
      forPublicMap
    >
      <PublicMapProvider publicMap={publicMap}>
        <PublicMap />
      </PublicMapProvider>
    </MapProviders>
  );
}
