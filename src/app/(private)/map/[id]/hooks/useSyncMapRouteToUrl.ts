"use client";

import { useSetAtom } from "jotai";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { mapRouteAtom } from "../atoms/mapStateAtoms";

/**
 * On the private map page, keeps `mapRouteAtom` in sync with the `mode`
 * URL query parameter.
 *
 * `?mode=publish`  → `"publish"`
 * otherwise        → `"editor"`
 *
 * Reacts to every searchParams change (e.g. when MapModeToggle
 * triggers a client-side navigation via router.replace).
 */
export function useSyncMapRouteToUrlEffect() {
  const setMapRoute = useSetAtom(mapRouteAtom);
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  useEffect(() => {
    setMapRoute(mode === "publish" ? "publish" : "editor");
  }, [mode, setMapRoute]);
}
