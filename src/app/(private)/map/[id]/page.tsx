import MapProviders from "@/components/Map/MapProviders";
import PrivateMap from "./PrivateMap";

export default async function MapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <MapProviders mapId={id}>
      <PrivateMap />
    </MapProviders>
  );
}
