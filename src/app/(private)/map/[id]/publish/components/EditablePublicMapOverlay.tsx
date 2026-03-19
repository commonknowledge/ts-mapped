"use client";

import { useViewId } from "@/app/(private)/map/[id]/hooks/useMapViews";
import Loading from "../../components/Loading";
import PublicMapOverlay from "../components/PublicMapOverlay";
import {
  useAutoPopulateDataSourcesEffect,
  usePublicMapQuery,
} from "../hooks/usePublicMapQuery";

/**
 * Thin wrapper used on the private route when `?mode=publish`.
 *
 * 1.  `usePublicMapQuery` fires the `publicMap.get` query internally, so the
 *     React Query cache is populated for all downstream consumers.
 * 2.  Auto-populates data-source configs for newly created public maps.
 * 3.  Renders the shared `PublicMapOverlay`.
 */
export default function EditablePublicMapOverlay() {
  const viewId = useViewId();
  const { publicMap, isPending } = usePublicMapQuery();

  // Auto-populate data source configs for fresh public maps
  useAutoPopulateDataSourcesEffect();

  if (!viewId || (isPending && !publicMap)) {
    return <Loading />;
  }

  return <PublicMapOverlay />;
}
