import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { cache } from "react";
import ReadOnlyMapControls from "@/app/(private)/map/[id]/components/readonly/ReadOnlyMapControls";
import ReadOnlyNavbar from "@/app/(private)/map/[id]/components/readonly/ReadOnlyNavbar";
import SharedMap from "@/app/(private)/map/[id]/components/SharedMap";
import MapJotaiProvider from "@/app/(private)/map/[id]/providers/MapJotaiProvider";
import { getShareGrants } from "@/auth/shareGrants";
import MapAccessCard from "@/components/MapAccessCard";
import MapAccessForm from "@/components/MapAccessForm";
import { findMapById } from "@/server/repositories/Map";
import { findMapShareByToken } from "@/server/repositories/MapShare";
import { findValidShareGrantForMap } from "@/server/utils/auth";
import { createCaller, getQueryClient, trpc } from "@/services/trpc/server";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ viewId?: string }>;
}

// Deduplicate the lookups between generateMetadata and the page render
// (memoised per request, and only within this module)
const getShareByToken = cache(findMapShareByToken);
const getMapById = cache(findMapById);

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { token } = await params;
  const share = await getShareByToken(token);
  const map = share?.enabled ? await getMapById(share.mapId) : null;
  return {
    title: map ? `${map.name} - Mapped` : "Mapped",
    // Share links are unlisted: never index them
    robots: { index: false, follow: false },
  };
}

export default async function SharedMapPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { viewId: requestedViewId } = await searchParams;

  const share = await getShareByToken(token);
  if (!share || !share.enabled) {
    notFound();
  }

  const grants = await getShareGrants();
  const grant = await findValidShareGrantForMap(grants, share.mapId);

  // No access yet: as on a moderated public map, the visitor requests
  // access by email, or arrives with a magic link that the form exchanges
  // for the grant cookie (cookies cannot be set during page render)
  if (!grant) {
    const map = await getMapById(share.mapId);
    return (
      <MapAccessCard name={map?.name ?? "Shared map"}>
        <MapAccessForm target={{ kind: "mapShare", shareToken: token }} />
      </MapAccessCard>
    );
  }

  const caller = await createCaller();
  const map = await caller.map.byId({ mapId: share.mapId });
  const views = [...map.views].sort((a, b) => a.position - b.position);
  const viewId =
    views.find((v) => v.id === requestedViewId)?.id ?? views[0]?.id;

  // Seed the React Query cache so the client's `useMapQuery` picks the map
  // up without a separate fetch (same pattern as the public map page)
  const queryClient = getQueryClient();
  queryClient.setQueryData(trpc.map.byId.queryKey({ mapId: share.mapId }), map);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MapJotaiProvider mapId={share.mapId} viewId={viewId} route="shared">
        <div className="relative h-screen w-full">
          <SharedMap />
          <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
            <ReadOnlyNavbar />
            <div className="flex-1 min-h-0 relative">
              {/* Desktop-only message for small screens */}
              <div className="pointer-events-auto lg:hidden flex h-full w-full justify-center items-center p-8 text-center z-20 relative bg-white">
                <p className="max-w-[40ch] font-medium text-base">
                  Your screen is too small to view this map. Please use a device
                  with a larger screen.
                </p>
              </div>
              <div className="hidden lg:contents">
                <ReadOnlyMapControls />
              </div>
            </div>
          </div>
        </div>
      </MapJotaiProvider>
    </HydrationBoundary>
  );
}
