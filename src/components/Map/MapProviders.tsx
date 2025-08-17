import { Fragment, ReactNode } from "react";
import ChoroplethProvider from "./providers/ChoroplethProvider";
import DataSourcesProvider from "./providers/DataSourcesProvider";
import MapProvider from "./providers/MapProvider";
import MarkerAndTurfProvider from "./providers/MarkerAndTurfProvider";
import TableProvider from "./providers/TableProvider";

export default async function MapProviders({
  mapId,
  viewId,
  forPublicMap = false,
  children,
}: {
  mapId: string;
  viewId?: string;
  forPublicMap?: boolean;
  children: ReactNode;
}) {
  // Skip providers not required by public maps
  const MaybeDataSourcesProvider = forPublicMap
    ? Fragment
    : DataSourcesProvider;
  const MaybeTableProvider = forPublicMap ? Fragment : TableProvider;

  return (
    <MapProvider mapId={mapId} viewId={viewId}>
      <MaybeDataSourcesProvider>
        <ChoroplethProvider>
          <MarkerAndTurfProvider>
            <MaybeTableProvider>{children}</MaybeTableProvider>
          </MarkerAndTurfProvider>
        </ChoroplethProvider>
      </MaybeDataSourcesProvider>
    </MapProvider>
  );
}
