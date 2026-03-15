import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import MapJotaiProvider from "@/app/map/[id]/providers/MapJotaiProvider";
import PublicMapOverlay from "@/app/map/[id]/publish/components/PublicMapOverlay";
import { createCaller, getQueryClient, trpc } from "@/services/trpc/server";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ host: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { host } = await params;
  const caller = await createCaller();

  const map = await caller.publicMap.get({
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
  const caller = await createCaller();

  const publicMap = await caller.publicMap.get({
    host: decodeURIComponent(host),
  });

  if (!publicMap) {
    notFound();
  }

  // Seed the React Query cache so client-side `usePublicMapQuery` picks it
  // up without a separate fetch.  The root layout's HydrationBoundary
  // dehydrates this for the client.
  const queryClient = getQueryClient();
  queryClient.setQueryData(
    trpc.publicMap.get.queryKey({ viewId: publicMap.viewId }),
    publicMap,
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MapJotaiProvider
        mapId={publicMap.mapId}
        viewId={publicMap.viewId}
        isPrivateRoute={false}
      >
        <PublicMapOverlay standalone />
      </MapJotaiProvider>
    </HydrationBoundary>
  );
}
