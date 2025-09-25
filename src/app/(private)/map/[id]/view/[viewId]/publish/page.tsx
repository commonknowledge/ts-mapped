import { v4 as uuidv4 } from "uuid";
import ChoroplethProvider from "@/components/Map/providers/ChoroplethProvider";
import DataRecordProvider from "@/components/Map/providers/DataRecordProvider";
import DataSourcesProvider from "@/components/Map/providers/DataSourcesProvider";
import MapProvider from "@/components/Map/providers/MapProvider";
import MarkerAndTurfProvider from "@/components/Map/providers/MarkerAndTurfProvider";
import PublicFiltersProvider from "@/components/PublicMap/providers/PublicFiltersProvider";
import PublicMap from "@/components/PublicMap/PublicMap";
import PublicMapProvider from "@/components/PublicMap/PublicMapProvider";
import { createCaller } from "@/services/trpc/server";

export default async function PublicMapAdminPage({
  params,
}: {
  params: Promise<{ id: string; viewId: string }>;
}) {
  const { id: mapId, viewId } = await params;
  const trpcServer = await createCaller();
  let publicMap = await trpcServer.publicMap.byViewId({ viewId });

  if (!publicMap) {
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
      createdAt: new Date(),
    };
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
