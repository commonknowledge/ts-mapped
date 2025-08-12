import { ReactNode } from "react";
import ChoroplethProvider from "./providers/ChoroplethProvider";
import DataSourcesProvider from "./providers/DataSourcesProvider";
import MapProvider from "./providers/MapProvider";
import MarkerAndTurfProvider from "./providers/MarkerAndTurfProvider";
import TableProvider from "./providers/TableProvider";

export default async function MapProviders({
  mapId,
  viewId,
  children,
}: {
  mapId: string;
  viewId?: string;
  children: ReactNode;
}) {
  return (
    <MapProvider mapId={mapId} viewId={viewId}>
      <DataSourcesProvider>
        <ChoroplethProvider>
          <MarkerAndTurfProvider>
            <TableProvider>{children}</TableProvider>
          </MarkerAndTurfProvider>
        </ChoroplethProvider>
      </DataSourcesProvider>
    </MapProvider>
  );
}
