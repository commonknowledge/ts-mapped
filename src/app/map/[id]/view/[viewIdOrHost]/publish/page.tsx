import { notFound } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { createCaller } from "@/services/trpc/server";
import ChoroplethProvider from "../../../providers/ChoroplethProvider";
import DataRecordProvider from "../../../providers/DataRecordProvider";
import DataSourcesProvider from "../../../providers/DataSourcesProvider";
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
  const queryClient = await createCaller();

  let publicMap = null;
  if (isPublicRoute) {
    publicMap = await queryClient.publicMap.getPublished({
      host: decodeURIComponent(viewIdOrHost),
    });
  } else {
    publicMap = await queryClient.publicMap.getEditable({
      viewId: viewIdOrHost,
    });
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
        <DataRecordProvider>
          <PublicMapProvider publicMap={publicMap} editable={!isPublicRoute}>
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
