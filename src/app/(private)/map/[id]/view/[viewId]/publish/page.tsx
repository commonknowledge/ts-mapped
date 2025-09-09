import { gql } from "@apollo/client";
import { v4 as uuidv4 } from "uuid";
import { PublicMapQuery, PublicMapQueryVariables } from "@/__generated__/types";
import ChoroplethProvider from "@/components/Map/providers/ChoroplethProvider";
import DataRecordProvider from "@/components/Map/providers/DataRecordProvider";
import DataSourcesProvider from "@/components/Map/providers/DataSourcesProvider";
import MapProvider from "@/components/Map/providers/MapProvider";
import MarkerAndTurfProvider from "@/components/Map/providers/MarkerAndTurfProvider";
import PublicFiltersProvider from "@/components/PublicMap/providers/PublicFiltersProvider";
import PublicMap from "@/components/PublicMap/PublicMap";
import PublicMapProvider from "@/components/PublicMap/PublicMapProvider";
import { getClient } from "@/services/apollo";

export default async function PublicMapAdminPage({
  params,
}: {
  params: Promise<{ id: string; viewId: string }>;
}) {
  const { id: mapId, viewId } = await params;
  const apolloClient = await getClient();
  const publicMapQuery = await apolloClient.query<
    PublicMapQuery,
    PublicMapQueryVariables
  >({
    query: gql`
      query PublicMap($viewId: String!) {
        publicMap(viewId: $viewId) {
          id
          mapId
          viewId
          host
          name
          description
          descriptionLink
          published
          dataSourceConfigs {
            allowUserEdit
            allowUserSubmit
            dataSourceId
            dataSourceLabel
            formUrl
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
    variables: { viewId },
  });
  let publicMap: PublicMapQuery["publicMap"];
  if (!publicMapQuery.data.publicMap) {
    publicMap = {
      id: uuidv4(),
      mapId,
      viewId,
      host: "",
      name: "My Public Map",
      description: "",
      descriptionLink: "",
      published: false,
      dataSourceConfigs: [],
    };
  } else {
    publicMap = publicMapQuery.data.publicMap;
  }
  return (
    <MapProvider mapId={mapId} viewId={viewId}>
      <DataSourcesProvider>
        <DataRecordProvider>
          <PublicMapProvider publicMap={publicMap} editable>
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
