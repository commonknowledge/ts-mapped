"use client";

import { useSetAtom } from "jotai";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { mapModeAtom } from "../atoms/mapStateAtoms";

/**
 * Keeps `mapModeAtom` in sync with the `mode` URL query parameter.
 *
 * `?mode=publish`  → `"public"`
 * otherwise        → `"private"`
 *
 * Reacts to every searchParams change (e.g. when MapVisibilityToggle
 * triggers a client-side navigation via router.replace).
 */
export function useSyncMapModeToUrlEffect() {
  const setMapMode = useSetAtom(mapModeAtom);
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  useEffect(() => {
    setMapMode(mode === "publish" ? "public" : "private");
  }, [mode, setMapMode]);
}
