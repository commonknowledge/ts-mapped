// Positions are percentages of the 1440 × 921 hero frame in Figma
// (Mapped V3, node 5969:15037), so the stage scales with the viewport.

export interface Hotspot {
  id: string;
  label: string;
  title: string;
  description: string;
  tooltipSide: "top" | "right" | "bottom" | "left";
  // Chosen so the tooltip doesn't cover the highlighted area
  tooltipAlign: "start" | "center" | "end";
  position:
    | // Dot at the end of a Figma connector, as % of the hero frame
      { type: "fixed"; left: number; top: number }
      // Connector drawn to the element with a matching data-hotspot-anchor,
      // with the dot above or below the line
    | { type: "anchored"; direction: "above" | "below" };
}

export const HOTSPOTS: Hotspot[] = [
  {
    id: "views",
    label: "01",
    title: "Saved views",
    description:
      "Save the layers, filters and styling you need for each job as a view, then switch between them in one click. Try it: switch between the views above the map.",
    tooltipSide: "right",
    tooltipAlign: "center",
    position: { type: "fixed", left: 39.879, top: 13.844 },
  },
  {
    id: "markers",
    label: "02",
    title: "Map your members",
    description:
      "Bring in members and places from Airtable, Action Network, Google Sheets, Mailchimp, Zetkin or a CSV. Synced lists stay up to date as membership changes. Click a layer's marker to show or hide it.",
    tooltipSide: "right",
    tooltipAlign: "end",
    position: { type: "anchored", direction: "above" },
  },
  {
    id: "boundaries",
    label: "03",
    title: "Any boundaries you need",
    description:
      "Switch between constituencies, wards, councils, regions and more, and every dataset on the map re-aggregates to match. Try switching to regions.",
    tooltipSide: "right",
    tooltipAlign: "start",
    position: { type: "anchored", direction: "below" },
  },
  {
    id: "data-visualisation",
    label: "04",
    title: "Visualise any data",
    description:
      "Colour areas by election results, census figures or your own spreadsheets, so you can see at a glance where support is strong and where it is soft. Try changing what the map is coloured by.",
    tooltipSide: "right",
    tooltipAlign: "end",
    position: { type: "anchored", direction: "above" },
  },
  {
    id: "inspector",
    label: "05",
    title: "Inspect any area",
    description:
      "Click an area to see everything you know about it — vote share, members, local data — then add it to your target areas. Click anywhere on the map.",
    tooltipSide: "left",
    tooltipAlign: "center",
    position: { type: "fixed", left: 91.598, top: 55.375 },
  },
];

// Anchored connectors, in px of the 1440px-wide demo frame (scaled at runtime)
export const ANCHORED_CONNECTOR = {
  // Dots alternate between two columns so the lines never cross
  dotX: { above: 168, below: 118 },
  // Short enough that facing neighbours (below, then above) don't meet
  rise: 34,
  cornerRadius: 10,
};

export type ShowcaseFeatureId = "members" | "data" | "strategise" | "win";

// Feature bands from the A2 poster (Figma node 5974:15222)
export const SHOWCASE_FEATURES: {
  id: ShowcaseFeatureId;
  title: string;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    id: "members",
    title: "Map your Members",
    label: "Markers",
    description:
      "Import or sync members from Action Network, Airtable, Baserow, CSV, Google Sheets, Mailchimp or Zetkin — keeping your organising map up to date as membership changes.",
    color: "#83a0d8",
  },
  {
    id: "data",
    title: "Overlay Data",
    label: "Data visualisation",
    description:
      "Layer election results, boundaries, canvassing areas and your own data on one map. Use colour-coded visualisations to reveal patterns by constituency, ward or postcode.",
    color: "#f08e8f",
  },
  {
    id: "strategise",
    title: "Strategise",
    label: "Inspector",
    description:
      "Explore constituencies in detail, compare local results and electorate data, and identify priority areas for organising, canvassing and campaigns.",
    color: "#f6c070",
  },
  {
    id: "win",
    title: "Win.",
    label: "Lists",
    description:
      "Build lists of the areas that matter, like your nearest marginals, ranked by any figure on the map. Each list is outlined on the map, so your team can focus resources and coordinate canvassing where it counts.",
    color: "#b6e6ab",
  },
];

// Points on land in map-dithered.png (569 × 772)
export const SHOWCASE_MEMBER_POINTS: [number, number][] = [
  [300, 180],
  [360, 160],
  [290, 260],
  [410, 250],
  [350, 320],
  [330, 380],
  [380, 380],
  [440, 420],
  [480, 460],
  [330, 450],
  [390, 500],
  [480, 530],
  [350, 560],
  [260, 560],
  [420, 600],
  [500, 620],
  [250, 620],
  [170, 600],
  [120, 640],
  [300, 680],
  [450, 690],
  [220, 700],
  [380, 720],
  [200, 180],
  [150, 120],
];

export const SHOWCASE_TARGETS: [number, number][] = [
  [350, 320],
  [420, 560],
  [230, 650],
];

// The hero's numbered headlines (Figma node 5986:89275); hovering one plays
// its scene on the hero map, with the feature's label and description from
// the poster bands above
export const HERO_FEATURES: { id: ShowcaseFeatureId; title: string }[] = [
  { id: "members", title: "Map your Members" },
  { id: "data", title: "Overlay Data" },
  { id: "strategise", title: "Strategise" },
  { id: "win", title: "Win" },
];

// On phones, how far down the screen a step's top must reach to become the
// current one: just below the map pinned above the steps
export const MOBILE_STEP_LINE = 0.62;

// The demo box's size in the desktop Figma frame (1440 wide), which phones
// show scaled down so the editor keeps its desktop layout
export const MOBILE_DEMO_SIZE = { width: 1043, height: 645 };

// The waitlist form, as linked from the login page
export const REQUEST_ACCESS_URL =
  "https://us19.list-manage.com/survey?u=7d61a70102ab811e6282bee60&id=089628c6aa&attribution=false";

export const NAV_ITEMS = [
  { label: "Solutions", href: "/solutions" },
  { label: "Docs", href: "/docs" },
  { label: "News", href: "/news" },
  { label: "About", href: "/about" },
];

// Long-form text (about, privacy, news, docs) in the homepage's ink and
// tight bold headings
export const MARKETING_PROSE =
  "max-w-none text-ink/80 prose-headings:font-bold prose-headings:tracking-[-0.032em] prose-headings:text-ink prose-h1:tracking-[-0.052em] prose-a:text-ink prose-strong:text-ink prose-li:marker:text-ink/40";
