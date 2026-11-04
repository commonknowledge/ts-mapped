"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useTRPC } from "@/services/trpc/react";
import { formatNumber } from "@/utils/text";
import { AREA_LIST_MEMBERS_SEARCH_FROM } from "../../constants";
import { useInspectorState } from "../../hooks/useInspectorState";
import { useMapRef } from "../../hooks/useMapCore";
import { useMarkerQueries } from "../../hooks/useMarkerQueries";
import type { AreaList } from "@/models/Map";

/**
 * Everyone in a marker layer (usually members) who lives in a list's areas,
 * as one list: who they are and which area they're in. Clicking one opens
 * them in the inspector.
 */
export default function AreaListMembers({
  list,
  dataSourceId,
  label,
}: {
  list: AreaList;
  dataSourceId: string;
  label: string;
}) {
  const trpc = useTRPC();
  const mapRef = useMapRef();
  const { setSelectedRecords } = useInspectorState();
  const { data: markerData } = useMarkerQueries();
  const [search, setSearch] = useState("");

  const { data, isPending } = useQuery(
    trpc.area.recordsInAreas.queryOptions({
      dataSourceId,
      areaSetCode: list.areaSetCode,
      areaCodes: list.areas.map((area) => area.code),
    }),
  );

  // Names and positions from the layer's markers, already on the map
  const people = useMemo(() => {
    const markers = new Map(
      (
        markerData.find((layer) => layer.dataSourceId === dataSourceId)
          ?.markers ?? []
      ).map((marker) => [marker.properties.id, marker]),
    );
    const areaNames = new Map(list.areas.map((area) => [area.code, area.name]));
    return (data?.records ?? [])
      .map((record) => {
        const marker = markers.get(record.id);
        return {
          id: record.id,
          name: marker?.properties.name || record.externalId,
          areaName: areaNames.get(record.areaCode) ?? record.areaCode,
          point: marker
            ? {
                lng: marker.geometry.coordinates[0],
                lat: marker.geometry.coordinates[1],
              }
            : null,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data?.records, dataSourceId, list.areas, markerData]);

  const query = search.trim().toLowerCase();
  const shown = query
    ? people.filter(
        (person) =>
          person.name.toLowerCase().includes(query) ||
          person.areaName.toLowerCase().includes(query),
      )
    : people;

  const open = (person: (typeof people)[number]) => {
    setSelectedRecords([
      {
        id: person.id,
        dataSourceId,
        geocodePoint: person.point,
        name: person.name,
      },
    ]);
    if (person.point) {
      mapRef?.current?.flyTo({
        center: [person.point.lng, person.point.lat],
        zoom: Math.max(mapRef.current.getZoom(), 12),
        duration: 1000,
      });
    }
  };

  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="flex items-baseline gap-1.5 font-mono text-[10px] tracking-wide text-neutral-500 uppercase">
        {label} in these areas
        {data && (
          <span className="text-neutral-400">{formatNumber(data.total)}</span>
        )}
      </h2>
      {isPending ? (
        <p className="flex items-center gap-2 text-xs text-neutral-500">
          <Loader2 className="size-3.5 animate-spin" />
          Finding them…
        </p>
      ) : people.length === 0 ? (
        <p className="text-xs text-neutral-500">None in these areas.</p>
      ) : (
        <>
          {people.length > AREA_LIST_MEMBERS_SEARCH_FROM && (
            <label className="flex h-7 items-center gap-1.5 rounded-md border border-input px-2">
              <SearchIcon className="size-3.5 shrink-0 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or area"
                className="min-w-0 flex-1 bg-transparent text-xs outline-none"
              />
            </label>
          )}
          <ul className="flex flex-col">
            {shown.map((person) => (
              <li key={person.id}>
                <button
                  type="button"
                  onClick={() => open(person)}
                  className="flex w-full cursor-pointer items-baseline gap-2 rounded-md px-1.5 py-1 text-left text-xs hover:bg-neutral-100"
                >
                  <span className="min-w-0 flex-1 truncate">{person.name}</span>
                  <span className="max-w-[45%] shrink-0 truncate text-[11px] text-neutral-500">
                    {person.areaName}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {data && data.total > people.length && (
            <p className="text-[11px] text-neutral-400">
              Showing the first {formatNumber(people.length)} of{" "}
              {formatNumber(data.total)}.
            </p>
          )}
        </>
      )}
    </section>
  );
}
