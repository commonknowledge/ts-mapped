import MapPage from "./MapPage";
import ChoroplethProvider from "./providers/ChoroplethProvider";
import DataSourcesProvider from "./providers/DataSourcesProvider";
import MapProvider from "./providers/MapProvider";
import MarkerAndTurfProvider from "./providers/MarkerAndTurfProvider";
import TableProvider from "./providers/TableProvider";

export default async function MapPageWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <MapProvider mapId={id}>
      <DataSourcesProvider>
        <ChoroplethProvider>
          <MarkerAndTurfProvider>
            <TableProvider>
              <MapPage />
            </TableProvider>
          </MarkerAndTurfProvider>
        </ChoroplethProvider>
      </DataSourcesProvider>
    </MapProvider>
  );
}
