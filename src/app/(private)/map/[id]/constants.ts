export { PARTY_COLORS } from "@/constants/colors";

export const DEFAULT_FILL_COLOR = "rgba(0, 0, 0, 0)";

// The bivariate key's levels on each axis, lowest first
export const BIVARIATE_LEVELS = ["Low", "Med", "High"];

// How long the areas take to fade from one view's data to the next
export const CHOROPLETH_CROSSFADE_MS = 600;

// Colours for lists of areas, handed out in turn: distinct from each other
// and from the choropleth's own scales
export const AREA_LIST_COLORS = [
  "#e11d48",
  "#7c3aed",
  "#0891b2",
  "#ea580c",
  "#16a34a",
  "#db2777",
  "#2563eb",
  "#ca8a04",
];

// How many of the areas shown in a ranking "List top" takes
export const AREA_LIST_FROM_RANKING = 10;

// Past this many people in a list's areas, the list inspector offers search
export const AREA_LIST_MEMBERS_SEARCH_FROM = 8;
