import MapPage from "./MapPage";

export default async function MapPageWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MapPage mapId={id} />;
}
