import { gql } from "@apollo/client";
import {
  PublishedPublicMapQuery,
  PublishedPublicMapQueryVariables,
} from "@/__generated__/types";
import ChoroplethProvider from "@/components/Map/providers/ChoroplethProvider";
import DataRecordProvider from "@/components/Map/providers/DataRecordProvider";
import DataSourcesProvider from "@/components/Map/providers/DataSourcesProvider";
import MapProvider from "@/components/Map/providers/MapProvider";
import MarkerAndTurfProvider from "@/components/Map/providers/MarkerAndTurfProvider";
import PublicFiltersProvider from "@/components/PublicMap/providers/PublicFiltersProvider";
import PublicMapProvider from "@/components/PublicMap/PublicMapProvider";
import { DEV_NEXT_PUBLIC_BASE_URL } from "@/constants";
import { getClient } from "@/services/apollo";
import PublicMap from "./PublicMap/PublicMap";

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
          host
          name
          description
          descriptionLink
          published
          dataSourceConfigs {
            dataSourceId
            dataSourceLabel
            nameLabel
            nameColumns
            descriptionLabel
            descriptionColumn
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
    <MapProvider mapId={publicMap.mapId} viewId={publicMap.viewId}>
      <DataSourcesProvider>
        <DataRecordProvider>
          <PublicMapProvider publicMap={publicMap}>
            <PublicFiltersProvider>
              <ChoroplethProvider>
                <MarkerAndTurfProvider>
                  <PublicMap />
                </MarkerAndTurfProvider>
              </ChoroplethProvider>
            </PublicFiltersProvider>
          </PublicMapProvider>
        </DataRecordProvider>
      </DataSourcesProvider>
    </MapProvider>
  );
}
