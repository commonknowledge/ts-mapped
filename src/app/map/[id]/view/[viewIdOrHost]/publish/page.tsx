import { notFound } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { getQueryClient, trpc } from "@/services/trpc/server";
import ChoroplethProvider from "../../../providers/ChoroplethProvider";
import DataSourcesProvider from "../../../providers/DataSourcesProvider";
import InspectorProvider from "../../../providers/InspectorProvider";
import MapProvider from "../../../providers/MapProvider";
import MarkerAndTurfProvider from "../../../providers/MarkerAndTurfProvider";
import PublicMap from "./components/PublicMap";
import PublicFiltersProvider from "./providers/PublicFiltersProvider";
import PublicMapProvider from "./providers/PublicMapProvider";

export default async function PublicMapAdminPage({
  params,
}: {
  params: Promise<{ id: string; viewIdOrHost: string }>;
}) {
  const { id: mapIdOrPublic, viewIdOrHost } = await params;
  const isPublicRoute = mapIdOrPublic === "public";
  const queryClient = getQueryClient();
  let publicMap = null;
  if (isPublicRoute) {
    publicMap = await queryClient.fetchQuery(
      trpc.publicMap.getPublished.queryOptions({
        host: decodeURIComponent(viewIdOrHost),
      }),
    );
  } else {
    publicMap = await queryClient.fetchQuery(
      trpc.publicMap.getEditable.queryOptions({
        viewId: viewIdOrHost,
      }),
    );
  }

  if (!publicMap) {
    if (isPublicRoute) {
      notFound();
    } else {
      publicMap = {
        id: uuidv4(),
        mapId: mapIdOrPublic,
        viewId: viewIdOrHost,
        host: "",
        name: "My Public Map",
        description: "",
        descriptionLink: "",
        published: false,
        dataSourceConfigs: [],
        createdAt: new Date(),
      };
    }
  }

  return (
    <MapProvider mapId={publicMap.mapId} viewId={publicMap.viewId}>
      <DataSourcesProvider>
        <InspectorProvider>
          <PublicMapProvider publicMap={publicMap} editable={!isPublicRoute}>
            <PublicFiltersProvider>
              <ChoroplethProvider>
                <MarkerAndTurfProvider>
                  <PublicMap />
                </MarkerAndTurfProvider>
              </ChoroplethProvider>
            </PublicFiltersProvider>
          </PublicMapProvider>
        </InspectorProvider>
      </DataSourcesProvider>
    </MapProvider>
  );
}
