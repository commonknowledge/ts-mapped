import { CHOROPLETH_LAYER_CONFIGS } from "@/app/(private)/map/[id]/components/Choropleth/configs";
import { DataSourceType } from "@/models/DataSource";
import type { Boundary, CollectionId, MarkerShape } from "./types";
import type { ChoroplethLayerConfig } from "@/app/(private)/map/[id]/components/Choropleth/configs";

// The same boundary tilesets the map editor uses
export const BOUNDARIES: Record<
  Boundary,
  {
    label: string;
    description: string;
    kind: string;
    layer: ChoroplethLayerConfig["mapbox"];
  }
> = {
  constituencies: {
    label: "Westminster",
    description: "650 Westminster constituencies",
    kind: "Westminster constituency",
    layer: CHOROPLETH_LAYER_CONFIGS.WMC24[0].mapbox,
  },
  regions: {
    label: "Regions",
    description: "12 UK nations and regions",
    kind: "Region",
    layer: CHOROPLETH_LAYER_CONFIGS.UKR18[0].mapbox,
  },
};

export const BOUNDARY_OPTIONS: Boundary[] = ["constituencies", "regions"];

export const MAP_STYLE = "mapbox://styles/mapbox/light-v11";

// Great Britain and Northern Ireland
export const UK_BOUNDS: [number, number, number, number] = [
  -8.2, 49.9, 1.8, 60.9,
];

export const PARTY_NAMES: Record<string, string> = {
  Lab: "Labour",
  Con: "Conservative",
  LD: "Liberal Democrat",
  RUK: "Reform UK",
  Green: "Green",
  SNP: "SNP",
  PC: "Plaid Cymru",
  DUP: "DUP",
  SF: "Sinn Féin",
  SDLP: "SDLP",
  UUP: "UUP",
  APNI: "Alliance",
  TUV: "TUV",
  Ind: "Independent",
  Spk: "Speaker",
  Other: "Other",
};

export const PARTY_COLORS: Record<string, string> = {
  Lab: "#e4003b",
  Con: "#0087dc",
  LD: "#faa61a",
  RUK: "#12b6cf",
  Green: "#02a95b",
  SNP: "#fdf38e",
  PC: "#005b54",
  DUP: "#d46a4c",
  SF: "#326760",
  SDLP: "#2aa82c",
  UUP: "#48a5ee",
  APNI: "#f6cb2f",
  TUV: "#0c3a6a",
  Ind: "#a1a1aa",
  Spk: "#52525b",
  Other: "#a1a1aa",
};

export const NO_DATA_COLOR = "#e4e4e7";

// Parties shown in the legend when colouring by winner
export const LEGEND_PARTIES = [
  "Lab",
  "Con",
  "LD",
  "RUK",
  "Green",
  "SNP",
  "PC",
  "SF",
  "DUP",
  "Ind",
];

export type Visualisation = "winner" | "Lab" | "Con" | "LD" | "RUK" | "Green";

export const VISUALISATIONS: { value: Visualisation; label: string }[] = [
  { value: "winner", label: "Winning party" },
  { value: "Lab", label: "Labour vote %" },
  { value: "Con", label: "Conservative vote %" },
  { value: "RUK", label: "Reform UK vote %" },
  { value: "LD", label: "Lib Dem vote %" },
  { value: "Green", label: "Green vote %" },
];

// Marker layers, in the editor's own member and marker colours (mapColors)
export const COLLECTIONS: Record<
  CollectionId,
  {
    name: string;
    source: DataSourceType;
    detail: string;
    // Inspector line for one or many records in an area
    countLabel: [string, string];
    color: string;
    shape: MarkerShape;
  }
> = {
  members: {
    name: "Lorik's Member List",
    source: DataSourceType.Airtable,
    detail: "Airtable · synced 2 min ago",
    countLabel: ["member of Lorik's list", "members of Lorik's list"],
    color: "#678de3",
    shape: "circle",
  },
  hubs: {
    name: "Organising hubs",
    source: DataSourceType.CSV,
    detail: "organising_hubs.csv",
    countLabel: ["organising hub", "organising hubs"],
    color: "#ff6b6b",
    shape: "square",
  },
};

export const COLLECTION_IDS: CollectionId[] = ["members", "hubs"];

export const VIEWS: {
  id: string;
  label: string;
  visualisation: Visualisation;
  collections: Record<CollectionId, boolean>;
}[] = [
  {
    id: "results",
    label: "Election results",
    visualisation: "winner",
    collections: { members: true, hubs: true },
  },
  {
    id: "reform",
    label: "Reform UK vote",
    visualisation: "RUK",
    collections: { members: false, hubs: true },
  },
  {
    id: "green",
    label: "Green vote",
    visualisation: "Green",
    collections: { members: true, hubs: false },
  },
];

// Hover outlines, marker outlines and other UI chrome
export const INK_COLOR = "#15213b";

export const FILL_OPACITY = 0.85;

// Every marker: white edge, collection-colour ring, ink fill (px)
export const MARKER_STYLE = { size: 13, edge: 1, ring: 2.5 };
