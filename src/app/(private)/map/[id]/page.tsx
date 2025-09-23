import ChoroplethProvider from "@/components/Map/providers/ChoroplethProvider";
import DataRecordProvider from "@/components/Map/providers/DataRecordProvider";
import DataSourcesProvider from "@/components/Map/providers/DataSourcesProvider";
import MapProvider from "@/components/Map/providers/MapProvider";
import MarkerAndTurfProvider from "@/components/Map/providers/MarkerAndTurfProvider";
import TableProvider from "@/components/Map/providers/TableProvider";
import PrivateMap from "./PrivateMap";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mapped - Map View",
};

export default async function MapPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ viewId: string | undefined }>;
}) {
  const { id } = await params;
  const { viewId } = await searchParams;
  return (
    <MapProvider mapId={id} viewId={viewId}>
      <DataSourcesProvider>
        <DataRecordProvider>
          <ChoroplethProvider>
            <MarkerAndTurfProvider>
              <TableProvider>
                <PrivateMap />
              </TableProvider>
            </MarkerAndTurfProvider>
          </ChoroplethProvider>
        </DataRecordProvider>
      </DataSourcesProvider>
    </MapProvider>
  );
}
