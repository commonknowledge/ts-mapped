export type Boundary = "constituencies" | "regions";

export type CollectionId = "members" | "hubs";

export type MarkerShape = "circle" | "square";

// A constituency or region, shaped for the map and inspector
export interface AreaResult {
  code: string;
  name: string;
  // Party coloured on the "Winning party" visualisation
  first: string;
  shares: Record<string, number>;
  facts: { label: string; value: string }[];
}

export interface MarkerPoint {
  lng: number;
  lat: number;
  name: string | null;
  // Constituency and region the point falls in
  areas: Record<Boundary, string>;
}
