import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import MapJotaiProvider from "@/app/(private)/map/[id]/providers/MapJotaiProvider";
import PublicMapOverlay from "@/app/(private)/map/[id]/publish/components/PublicMapOverlay";
import { PUBLIC_MAP_EMBED_PAGE_PARAM } from "@/constants";
import { createCaller, getQueryClient, trpc } from "@/services/trpc/server";
import { getPublicMapUrl } from "@/utils/appUrl";
import { getEmbedContext } from "@/utils/publicMapAccess";
import PublicMapAccessGate from "./components/PublicMapAccessGate";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ host: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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

export default async function PublicMapPage({ params, searchParams }: Props) {
  const { host } = await params;
  const embedPage = (await searchParams)[PUBLIC_MAP_EMBED_PAGE_PARAM];
  const caller = await createCaller();

  const publicMap = await caller.publicMap.get({
    host: decodeURIComponent(host),
  });

  if (!publicMap) {
    notFound();
  }

  // A moderated map the visitor has no access to: the server withholds the
  // map's data, so show the gate instead of loading the map
  if (!publicMap.accessGranted) {
    return (
      <PublicMapAccessGate
        publicMapId={publicMap.id}
        name={publicMap.name}
        description={publicMap.description}
        mapUrl={getPublicMapUrl(publicMap.host ?? "")}
        embedContext={getEmbedContext({
          embedOrigins: publicMap.embedOrigins,
          pageUrl: typeof embedPage === "string" ? embedPage : null,
        })}
      />
    );
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
        isPublicMapRoute={true}
      >
        <PublicMapOverlay standalone />
      </MapJotaiProvider>
    </HydrationBoundary>
  );
}
