import type { ContentImage } from "./types";

// Screenshots used across Solutions and Docs, captured from the Sample Map
// in public/docs at 2× (1600 × 1000) for sharp display
const screenshot = (file: string, alt: string): ContentImage => ({
  src: `/docs/${file}`,
  alt,
  width: 1600,
  height: 1000,
});

export const EDITOR_ELECTION_RESULTS = screenshot(
  "editor-election-results-2x.jpg",
  "The editor with members as markers and 2024 election results colouring each constituency by its winning party",
);

export const INSPECTOR_AREA = screenshot(
  "inspector-area-2x.jpg",
  "The inspector open on a constituency, showing its election results with Add to list and Compare",
);

export const INSPECTOR_MARKERS = screenshot(
  "inspector-markers-2x.jpg",
  "The inspector's Markers tab listing the members who live in a constituency",
);

export const COMPARING_COLUMNS = screenshot(
  "comparing-columns-2x.jpg",
  "Two census columns compared on one map, with a three-by-three grid as the colour key",
);

export const BOUNDARIES = screenshot(
  "boundaries-2x.jpg",
  "The boundaries picker listing parliaments and local government boundaries",
);

export const ADD_DATA = screenshot(
  "add-data-2x.jpg",
  "The data visualisation panel listing your data sources and public data",
);

export const ADD_MARKERS = screenshot(
  "add-markers-2x.jpg",
  "The add markers panel with custom markers, place search, folders and your collections",
);

export const RANKING = screenshot(
  "ranking-2x.jpg",
  "Every constituency ranked by majority, lowest first, with Add to list",
);

export const LIST_QUICK_ADD = screenshot(
  "list-quick-add-2x.jpg",
  "Clicking constituencies onto a list, with the list's areas highlighted on the map",
);

export const LIST_INSPECTOR = screenshot(
  "list-inspector-2x.jpg",
  "A list of seats outlined on the map, with its members, data and a table of its areas",
);

export const TUTORIALS = screenshot(
  "tutorials-2x.jpg",
  "The Tutorials tab on the Maps page, with Mapped basics",
);

export const DATA_SOURCES = screenshot(
  "data-sources-2x.jpg",
  "The Your data sources page listing member lists and other data, with Connect data",
);

export const DATA_LIBRARY = screenshot(
  "data-library-2x.jpg",
  "The Movement data library page with the 2024 general election results",
);
