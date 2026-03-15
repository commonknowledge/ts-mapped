import { notFound } from "next/navigation";
import MapJotaiProvider from "@/app/map/[id]/providers/MapJotaiProvider";
import PublicMapOverlay from "@/app/map/[id]/publish/components/PublicMapOverlay";
import { createCaller } from "@/services/trpc/server";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ host: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { host } = await params;
  const queryClient = await createCaller();

  const map = await queryClient.publicMap.getPublished({
    host: decodeURIComponent(host),
  });

  const OGImage = map?.imageUrl || "/og_image.png";

  return {
    title: Boolean(map?.name) ? `${map?.name} - Mapped` : "Mapped",
    description: map?.description || "",
    openGraph: {
      images: [OGImage],
    },
  };
}

export default async function PublicMapPage({ params }: Props) {
  const { host } = await params;
  const queryClient = await createCaller();

  const publicMap = await queryClient.publicMap.getPublished({
    host: decodeURIComponent(host),
  });

  if (!publicMap) {
    notFound();
  }

  return (
    <MapJotaiProvider
      mapId={publicMap.mapId}
      viewId={publicMap.viewId}
      mapMode="public"
      showNavbar={false}
      publicMap={publicMap}
    >
      <PublicMapOverlay standalone />
    </MapJotaiProvider>
  );
}
