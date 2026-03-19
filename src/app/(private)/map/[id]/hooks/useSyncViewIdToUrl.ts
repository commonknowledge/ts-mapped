"use client";

import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { viewIdAtom } from "../atoms/mapStateAtoms";

/**
 * One-way sync from `viewIdAtom` to the `viewId` URL query parameter.
 *
 * The atom is initially hydrated from the URL by MapJotaiProvider.
 * This hook writes subsequent atom changes back to the URL via
 * `history.replaceState` (avoids Next.js RSC round-trips).
 */
export function useSyncViewIdToUrlEffect() {
  const viewId = useAtomValue(viewIdAtom);

  useEffect(() => {
    if (!viewId) return;

    const url = new URL(window.location.href);
    if (url.searchParams.get("viewId") === viewId) return;

    url.searchParams.set("viewId", viewId);
    window.history.replaceState(window.history.state, "", url.toString());
  }, [viewId]);
}
