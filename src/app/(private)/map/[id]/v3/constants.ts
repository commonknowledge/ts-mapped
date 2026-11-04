import { AreaSetCode, AreaSetGroupCode } from "@/models/AreaSet";

/**
 * The boundary sets as the light editor offers them: grouped by what they're
 * for, with plain names and a line on each. "then … as you zoom in" sets
 * switch to smaller areas at closer zoom levels.
 */
export const BOUNDARY_GROUPS: {
  label: string;
  options: { code: AreaSetGroupCode; name: string; description: string }[];
}[] = [
  {
    label: "Parliaments",
    options: [
      {
        code: AreaSetGroupCode.WMC24,
        name: "Westminster constituencies",
        description: "UK Parliament seats, 2024 boundaries",
      },
      {
        code: AreaSetGroupCode.SPC22,
        name: "Scottish Parliament constituencies",
        description: "Holyrood seats",
      },
      {
        code: AreaSetGroupCode.SENC22,
        name: "Senedd constituencies",
        description: "Welsh Parliament seats",
      },
    ],
  },
  {
    label: "Local government",
    options: [
      {
        code: AreaSetGroupCode.LAD25,
        name: "Local authorities",
        description: "District, borough and unitary councils",
      },
      {
        code: AreaSetGroupCode.W26,
        name: "Local authorities, then wards",
        description: "Council wards as you zoom in",
      },
      {
        code: AreaSetGroupCode.CTYUA24,
        name: "Counties",
        description: "Counties and unitary authorities",
      },
      {
        code: AreaSetGroupCode.CED26,
        name: "Counties, then electoral divisions",
        description: "County council divisions as you zoom in",
      },
      {
        code: AreaSetGroupCode.CAUTH25,
        name: "Combined authorities",
        description: "Groups of councils, often with a mayor",
      },
      {
        code: AreaSetGroupCode.PUA26,
        name: "Proposed unitary authorities",
        description: "New councils proposed in local government reorganisation",
      },
    ],
  },
  {
    label: "Census neighbourhoods",
    options: [
      {
        code: AreaSetGroupCode.MSOA21,
        name: "MSOAs, then output areas",
        description:
          "England and Wales: about 7,000 people each, then about 300",
      },
      {
        code: AreaSetGroupCode.LSOA21,
        name: "MSOAs, then LSOAs, then output areas",
        description: "Adds LSOAs, about 1,500 people each, in between",
      },
      {
        code: AreaSetGroupCode.SOA22,
        name: "Scottish census areas",
        description: "Intermediate zones, then data zones and output areas",
      },
    ],
  },
  {
    label: "Regions and nations",
    options: [
      {
        code: AreaSetGroupCode.UKR18,
        name: "Regions",
        description: "English regions, plus Scotland, Wales and NI",
      },
      {
        code: AreaSetGroupCode.UKC24,
        name: "Countries",
        description: "England, Scotland, Wales and Northern Ireland",
      },
    ],
  },
  {
    label: "Other",
    options: [
      {
        code: AreaSetGroupCode.ICB22,
        name: "NHS integrated care boards",
        description: "Areas that plan health services in England",
      },
      {
        code: AreaSetGroupCode.COED26,
        name: "Church of England dioceses",
        description: "Areas served by each bishop",
      },
    ],
  },
];

/** The single boundary sets offered as overlays (outlines over the data),
 *  grouped and described like BOUNDARY_GROUPS */
export const OVERLAY_GROUPS: {
  label: string;
  options: { code: AreaSetCode; name: string; description: string }[];
}[] = [
  {
    label: "Parliaments",
    options: [
      {
        code: AreaSetCode.WMC24,
        name: "Westminster constituencies",
        description: "UK Parliament seats, 2024 boundaries",
      },
      {
        code: AreaSetCode.SPC22,
        name: "Scottish Parliament constituencies",
        description: "Holyrood seats",
      },
      {
        code: AreaSetCode.SENC22,
        name: "Senedd constituencies",
        description: "Welsh Parliament seats",
      },
    ],
  },
  {
    label: "Local government",
    options: [
      {
        code: AreaSetCode.LAD25,
        name: "Local authorities",
        description: "District, borough and unitary councils",
      },
      {
        code: AreaSetCode.W26,
        name: "Wards",
        description: "Council electoral wards",
      },
      {
        code: AreaSetCode.CTYUA24,
        name: "Counties",
        description: "Counties and unitary authorities",
      },
      {
        code: AreaSetCode.CED26,
        name: "County electoral divisions",
        description: "County council divisions",
      },
      {
        code: AreaSetCode.CAUTH25,
        name: "Combined authorities",
        description: "Groups of councils, often with a mayor",
      },
      {
        code: AreaSetCode.PUA26,
        name: "Proposed unitary authorities",
        description: "New councils proposed in local government reorganisation",
      },
    ],
  },
  {
    label: "Census neighbourhoods",
    options: [
      {
        code: AreaSetCode.MSOA21,
        name: "MSOAs",
        description: "England and Wales, about 7,000 people each",
      },
      {
        code: AreaSetCode.LSOA21,
        name: "LSOAs",
        description: "England and Wales, about 1,500 people each",
      },
      {
        code: AreaSetCode.OA21,
        name: "Output areas",
        description: "England and Wales, about 300 people each",
      },
      {
        code: AreaSetCode.SIZ22,
        name: "Scottish intermediate zones",
        description: "Scotland's larger census areas",
      },
      {
        code: AreaSetCode.SDZ22,
        name: "Scottish data zones",
        description: "Scotland's smaller census areas",
      },
      {
        code: AreaSetCode.SOA22,
        name: "Scottish output areas",
        description: "Scotland's smallest census areas",
      },
    ],
  },
  {
    label: "Regions and nations",
    options: [
      {
        code: AreaSetCode.UKR18,
        name: "Regions",
        description: "English regions, plus Scotland, Wales and NI",
      },
      {
        code: AreaSetCode.UKC24,
        name: "Countries",
        description: "England, Scotland, Wales and Northern Ireland",
      },
    ],
  },
  {
    label: "Other",
    options: [
      {
        code: AreaSetCode.ICB22,
        name: "NHS integrated care boards",
        description: "Areas that plan health services in England",
      },
      {
        code: AreaSetCode.COED26,
        name: "Church of England dioceses",
        description: "Areas served by each bishop",
      },
    ],
  },
];

// Great Britain, which some steps zoom back out to
export const TOUR_OVERVIEW_BOUNDS: [[number, number], [number, number]] = [
  [-8.2, 49.9],
  [1.8, 58.7],
];

// The guided tour of the light editor, run on a tutorial map that starts
// empty. Each step points at the control to use next and, with an
// `action`, waits for you to use it; utils/tour.ts says when it's done.
export type TourStepId =
  | "welcome"
  | "addMembers"
  | "toggleLayer"
  | "customMarker"
  | "addAreaData"
  | "chooseColumn"
  | "pickColumn"
  | "changeBoundaries"
  | "clickArea"
  | "markersTab"
  | "showOnMap"
  | "marginalSeats"
  | "yourList"
  | "insideList"
  | "membersVisualisation"
  | "views"
  | "finish";

/** What the tour watches in the editor, to know when a step is done and
 *  what to point at next */
export interface TourSnapshot {
  layerCount: number;
  hiddenLayerCount: number;
  customMarkerCount: number;
  areaDataSourceId: string;
  areaDataKey: string;
  areaSetGroupCode: string;
  boundariesLocked: boolean;
  boundaryCode: string | null;
  inspectorTab: string | null;
  listAreaCount: number;
  inspectedListId: string | null;
  newestListId: string | null;
  viewId: string | null;
  viewCount: number;
}

export interface TourTargetContext {
  now: TourSnapshot;
  /** How things were when the step started */
  start: TourSnapshot;
  /** The tutorial map's own data, when it's a tutorial map */
  tutorial: { membersDataSourceId: string; areaDataSourceId: string } | null;
}

export const TOUR_STEPS: {
  id: TourStepId;
  title: string;
  body: string;
  action?: string;
  /** What to outline: selectors in order of preference (the first on screen
   *  wins), or worked out from where you've got to within the step */
  target?: string[] | ((context: TourTargetContext) => string[]);
  /** Zoom back out to the whole country as the step starts */
  zoomOut?: boolean;
  /** Close side panels as the step starts, so the sidebar and map are clear */
  closePanels?: boolean;
  /** Somewhere to read more, opened in a new tab */
  link?: { label: string; href: string };
}[] = [
  {
    id: "welcome",
    title: "Build a map",
    body: "This tutorial map starts empty. You'll add some sample members and the 2024 general election results, trying what's new in the editor as you go. Each step moves on once you've done it.",
  },
  {
    id: "addMembers",
    title: "Add your members",
    body: "Markers are people and places: members, supporters, venues. They come from your data sources, listed under Collections.",
    action: "Click + next to Markers, then choose Tutorial members",
    target: ["[data-tour-focused]", '[data-tour="add-markers-button"]'],
  },
  {
    id: "toggleLayer",
    title: "Every marker layer has a ring",
    body: "Each layer's coloured ring is its identity: the same ring marks it on the map, in the inspector and anywhere it's used. The ring shows and hides the layer; right-click the layer for its colour and other settings.",
    action:
      "Click the ring next to Tutorial members to hide them, then again to bring them back",
    target: ({ tutorial }) => [
      `[data-tour-ring="${tutorial?.membersDataSourceId}"]`,
      "[data-tour-ring]",
    ],
  },
  {
    id: "customMarker",
    title: "Your own markers",
    body: 'You can also pin places yourself: drop a marker on the map or search for an address. They\'re kept in the Custom markers folder, which opens to show each one you add. "New folder" in the same panel groups them however you like.',
    action: 'Click +, choose "Drop a custom marker", then click the map',
    target: [
      '[data-tour="map-message"]',
      '[data-tour="drop-marker"]',
      '[data-tour="add-markers-button"]',
    ],
  },
  {
    id: "addAreaData",
    title: "Colour the map by data",
    body: "Areas holds data about places, such as election results or census figures, to colour the map's boundaries by.",
    action: "Click + next to Areas and choose 2024 General Election Results",
    target: ["[data-tour-focused]", '[data-tour="add-area-button"]'],
    zoomOut: true,
  },
  {
    id: "chooseColumn",
    title: "Choose a column",
    body: "A data source has many columns. The one you choose colours the map, and its colour key appears below it.",
    action: "Pick a column from Column, such as a party's share of the vote",
    target: ['[data-tour="column-picker"]', '[data-tour="add-area-button"]'],
  },
  {
    id: "pickColumn",
    title: "Grouped by data source",
    body: "Each source in Areas is one group with its columns underneath, and one tab in the inspector. Switching columns fades the areas from one to the next.",
    action: 'Click "Add a column", then pick another one',
    target: ({ now }) =>
      // "source|column": a column is chosen, so add another
      now.areaDataKey.includes("|")
        ? ['[data-tour="add-column"]', '[data-tour="areas"]']
        : ['[data-tour="column-picker"]'],
  },
  {
    id: "changeBoundaries",
    title: "Boundaries: the data's, or one for all",
    body: "Each dataset is shown at its own level: election results by constituency, census figures by neighbourhood. You can change that in the card under the column. Or lock the boundaries here, and every dataset is shown on the same ones, so you can compare like with like.",
    action: "Click the lock to use one set of boundaries for all data",
    target: ['[data-tour="boundaries-lock"]', '[data-tour="boundaries"]'],
    closePanels: true,
  },
  {
    id: "clickArea",
    title: "The inspector",
    body: "Clicking an area opens the inspector, with the data you've added in Areas for that place. Each source in Areas is a tab here, in the same order, so adding data there adds it here too.",
    action:
      "We've zoomed in to the constituency with the most members. Click it",
    closePanels: true,
  },
  {
    id: "markersTab",
    title: "Who's in this area",
    body: "After the data tabs come Markers and Notes. Markers lists the people and places in the area, grouped by layer.",
    action: "Open the Markers tab to see the members in this constituency",
    target: ['[data-tab-id="markers"]', "#inspector-panel"],
  },
  {
    id: "showOnMap",
    title: "Show it on the map",
    body: "Anything in the inspector can colour the map: right-click a figure for its options, such as adding it to the map's data or comparing areas by it.",
    action:
      'Go back to the election results tab, right-click Majority and choose "Add column to data visualisation"',
    target: ({ now, tutorial }) => {
      const areaSourceId = tutorial?.areaDataSourceId || now.areaDataSourceId;
      // Still on Markers (or another tab): point back at the results
      return now.inspectorTab && now.inspectorTab !== areaSourceId
        ? [`[data-tab-id="${areaSourceId}"]`, "#inspector-panel"]
        : [
            // The menu option once it's open, else the figure to right-click
            '[data-tour-action="show"]',
            '[data-tour-field="Majority"]',
            "#inspector-panel",
          ];
    },
  },
  {
    id: "marginalSeats",
    title: "List the most marginal seats",
    body: "Lists collect the areas you're working on, such as target seats. Compare across areas ranks every constituency by a figure: lowest Majority first shows the most marginal seats.",
    action:
      'Right-click Majority, choose "Compare across areas", sort "Lowest first", then click "List top 10"',
    // Each part in turn: the figure, the menu option, the sort, the button
    target: [
      '[data-tour="list-top"][data-ascending="true"]',
      '[data-tour="ranking-sort"][data-ascending="false"]',
      '[data-tour-action="rank"]',
      '[data-tour-field="Majority"]',
      "#inspector-panel",
    ],
  },
  {
    id: "yourList",
    title: "Your list",
    body: 'Lists sit at the foot of Areas, outlined on the map in their colour. You can also add any area from the inspector with "Add to list", or make a list from a square in a two-column key.',
    action:
      "Close the comparison, then click your new list's name to inspect it",
    target: ({ now }) => [
      `[data-tour-list="${now.newestListId}"]`,
      '[data-tour="area-lists"]',
    ],
  },
  {
    id: "insideList",
    title: "Inside a list",
    body: 'How many of your members live in these seats, how the data on the map compares with everywhere else, each seat in a table you can sort, and everyone who lives in them. Click a seat or a person to go there; "Back to" returns to the list.',
    target: ["#inspector-panel"],
  },
  {
    id: "membersVisualisation",
    title: "Where your members are",
    body: "Marker layers can colour the map too: shading each area by how many of the layer's records fall in it, in the layer's own colour. It's added under Visualisations, so you can switch back to the election results at any time.",
    action:
      'Right-click Tutorial members and choose "Create data visualisation"',
    target: ({ tutorial }) => [
      '[data-tour-action="create-visualisation"]',
      `[data-tour-layer="${tutorial?.membersDataSourceId}"]`,
      "[data-tour-layer]",
    ],
    zoomOut: true,
    closePanels: true,
  },
  {
    id: "views",
    title: "Views",
    body: "Views are different set-ups of the same map: other data, other boundaries, other markers on show. Switching between them fades the areas across so you can see what changes.",
    action:
      "Click + to add a view, then switch back to Default View and watch the map fade in",
    target: ({ now, start }) =>
      now.viewCount > start.viewCount && now.viewId !== start.viewId
        ? [`[data-tour-view="${start.viewId}"]`, '[data-tour="views"]']
        : ['[data-tour="add-view"]', '[data-tour="views"]'],
    zoomOut: true,
  },
  {
    id: "finish",
    title: "That's the tour",
    body: "This map is yours to keep or delete. More tutorials, such as bringing in your own data and setting up the inspector, are under Maps › Tutorials.",
  },
];

// The tour card's width, the room kept clear for the navbar and around the
// screen's edges, and how long a done step shows its tick before moving on
export const TOUR_CARD_WIDTH = 300;
export const TOUR_NAVBAR_HEIGHT = 64;
export const TOUR_EDGE = 16;
export const TOUR_DONE_PAUSE_MS = 900;
