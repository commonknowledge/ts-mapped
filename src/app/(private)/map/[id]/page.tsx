import MapPage from "./MapPage";
import ChoroplethProvider from "./providers/ChoroplethProvider";
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
      <ChoroplethProvider>
        <MarkerAndTurfProvider>
          <TableProvider>
            <MapPage />
          </TableProvider>
        </MarkerAndTurfProvider>
      </ChoroplethProvider>
    </MapProvider>
  );
}
