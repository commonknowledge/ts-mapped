import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import ReadOnlyMapControls from "@/app/(private)/map/[id]/components/readonly/ReadOnlyMapControls";
import ReadOnlyNavbar from "@/app/(private)/map/[id]/components/readonly/ReadOnlyNavbar";
import SharedMap from "@/app/(private)/map/[id]/components/SharedMap";
import MapJotaiProvider from "@/app/(private)/map/[id]/providers/MapJotaiProvider";
import { getShareGrants } from "@/auth/shareGrants";
import { findMapById } from "@/server/repositories/Map";
import { findMapShareByToken } from "@/server/repositories/MapShare";
import { findValidShareGrantForMap } from "@/server/utils/auth";
import { createCaller, getQueryClient, trpc } from "@/services/trpc/server";
import ShareClaim from "./components/ShareClaim";
import SharePasswordForm from "./components/SharePasswordForm";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ viewId?: string }>;
}

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { token } = await params;
  const share = await findMapShareByToken(token);
  const map = share?.enabled ? await findMapById(share.mapId) : null;
  return {
    title: map ? `${map.name} - Mapped` : "Mapped",
    // Share links are unlisted: never index them
    robots: { index: false, follow: false },
  };
}

export default async function SharedMapPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { viewId: requestedViewId } = await searchParams;

  const share = await findMapShareByToken(token);
  if (!share || !share.enabled) {
    notFound();
  }

  const grants = await getShareGrants();
  const grant = await findValidShareGrantForMap(grants, share.mapId);

  if (!grant) {
    if (share.passwordHash) {
      const map = await findMapById(share.mapId);
      return (
        <SharePasswordForm token={token} mapName={map?.name ?? "Shared map"} />
      );
    }
    // Passwordless: the grant cookie is minted by the claim endpoint
    // (cookies cannot be set during page render). ShareClaim calls it and
    // refreshes, after which the grant check above passes.
    return <ShareClaim token={token} />;
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
      <MapJotaiProvider mapId={share.mapId} viewId={viewId} isReadOnlyRoute>
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
