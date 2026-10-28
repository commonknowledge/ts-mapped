import { COLLECTION_IDS, PARTY_NAMES } from "./constants";
import constituenciesJson from "./data/constituencies.json";
import hubsJson from "./data/hubs.json";
import membersJson from "./data/members.json";
import regionsJson from "./data/regions.json";
import type { AreaResult, Boundary, CollectionId, MarkerPoint } from "./types";
import type { FeatureCollection, Point } from "geojson";

// JSON inference marks keys missing from a row as `?: undefined`
const toNumberRecord = (record: Record<string, number | undefined>) =>
  Object.fromEntries(
    Object.entries(record).filter(
      (entry): entry is [string, number] => typeof entry[1] === "number",
    ),
  );

const partyName = (party: string) => PARTY_NAMES[party] ?? party;

const CONSTITUENCIES: AreaResult[] = constituenciesJson.map((c) => ({
  code: c.code,
  name: c.name,
  first: c.first,
  shares: toNumberRecord(c.shares),
  facts: [
    { label: "Winner", value: partyName(c.first) },
    { label: "Result", value: c.result },
    { label: "Majority", value: c.majority.toLocaleString("en-GB") },
    { label: "Turnout", value: `${c.turnout}%` },
  ],
}));

const REGIONS: AreaResult[] = regionsJson.map((r) => {
  const seats = toNumberRecord(r.seats);
  return {
    code: r.code,
    name: r.name,
    first: r.first,
    shares: toNumberRecord(r.shares),
    facts: [
      { label: "Most seats", value: partyName(r.first) },
      { label: "Seats won", value: `${seats[r.first]} of ${r.totalSeats}` },
      { label: "Constituencies", value: String(r.totalSeats) },
      { label: "Turnout", value: `${r.turnout}%` },
    ],
  };
});

export const AREAS: Record<Boundary, AreaResult[]> = {
  constituencies: CONSTITUENCIES,
  regions: REGIONS,
};

export const AREAS_BY_CODE: Record<string, AreaResult> = Object.fromEntries(
  [...CONSTITUENCIES, ...REGIONS].map((area) => [area.code, area]),
);

const REGION_BY_CONSTITUENCY: Record<string, string> = Object.fromEntries(
  constituenciesJson.map((c) => [c.code, c.region]),
);

export const MARKERS: Record<CollectionId, MarkerPoint[]> = {
  members: membersJson.map(([lng, lat, code]) => ({
    lng: Number(lng),
    lat: Number(lat),
    name: null,
    areas: {
      constituencies: String(code),
      regions: REGION_BY_CONSTITUENCY[String(code)] ?? "",
    },
  })),
  hubs: hubsJson.map(([name, lng, lat, constituency, region]) => ({
    lng: Number(lng),
    lat: Number(lat),
    name: String(name),
    areas: { constituencies: String(constituency), regions: String(region) },
  })),
};

export const MARKER_TOTALS: Record<CollectionId, number> = {
  members: MARKERS.members.length,
  hubs: MARKERS.hubs.length,
};

export const MARKERS_GEOJSON = Object.fromEntries(
  COLLECTION_IDS.map((id) => [
    id,
    {
      type: "FeatureCollection",
      features: MARKERS[id].map(({ lng, lat, name }) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [lng, lat] },
        properties: { name },
      })),
    } satisfies FeatureCollection<Point>,
  ]),
);

// Marker counts keyed by constituency and region code
const countByArea = (points: MarkerPoint[]) =>
  points.reduce<Record<string, number>>((counts, { areas }) => {
    const next = { ...counts };
    for (const code of Object.values(areas)) {
      next[code] = (next[code] ?? 0) + 1;
    }
    return next;
  }, {});

export const MARKER_COUNTS: Record<CollectionId, Record<string, number>> = {
  members: countByArea(MARKERS.members),
  hubs: countByArea(MARKERS.hubs),
};

// Open on the area with the most members
const mostMembers = (areas: AreaResult[]) =>
  areas
    .map((a) => a.code)
    .sort(
      (a, b) =>
        (MARKER_COUNTS.members[b] ?? 0) - (MARKER_COUNTS.members[a] ?? 0),
    )[0] ?? null;

export const DEFAULT_SELECTED: Record<Boundary, string | null> = {
  constituencies: mostMembers(CONSTITUENCIES),
  regions: mostMembers(REGIONS),
};
