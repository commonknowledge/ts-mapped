"use client";

import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import { useMapId } from "../../hooks/useMapCore";
import { useMapQuery } from "../../hooks/useMapQuery";
import ReadOnlyMapViews from "./ReadOnlyMapViews";

/**
 * Navbar for the read-only shared map page: map name, view switcher and
 * area search. None of the private navbar's editing affordances — and
 * crucially none of its side effects (initial-view creation, thumbnail
 * upload), which write to the map.
 */
export default function ReadOnlyNavbar() {
  const mapId = useMapId();
  const { data: map } = useMapQuery(mapId);

  return (
    <Navbar>
      <div className="flex justify-between items-center gap-4 w-full">
        <div className="flex items-center gap-4 min-w-0">
          <p className="truncate max-w-[300px] text-sm text-neutral-600">
            {map ? map.name : "Loading..."}
          </p>
          <ReadOnlyMapViews />
        </div>
        <SearchBox />
      </div>
    </Navbar>
  );
}

const SearchBox = dynamic(
  () => import("../SearchBox").then((mod) => ({ default: mod.SearchBox })),
  {
    ssr: false,
    loading: () => null,
  },
);
