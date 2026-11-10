import {
  ADD_DATA,
  ADD_MARKERS,
  BOUNDARIES,
  COMPARING_COLUMNS,
  DATA_LIBRARY,
  DATA_SOURCES,
  EDITOR_ELECTION_RESULTS,
  INSPECTOR_AREA,
  INSPECTOR_MARKERS,
  LIST_INSPECTOR,
  LIST_QUICK_ADD,
  RANKING,
  TUTORIALS,
} from "./images";
import type { DocGroup } from "./types";

// The docs, in sidebar order. Slugs are their addresses (/docs/<slug>);
// retired ones redirect in next.config.ts.
export const DOC_GROUPS: DocGroup[] = [
  {
    title: "Getting started",
    description: "Find your way around Mapped.",
    pages: [
      {
        slug: "tutorial",
        title: "The guided tutorial",
        subtitle:
          "The quickest way to learn Mapped: build a map step by step with sample members and election data.",
        intro: [
          "The tutorial makes you an empty map and walks you through it, one step at a time. Each step points at the control to use and moves on once you've used it.",
        ],
        sections: [
          {
            title: "Start the tutorial",
            steps: [
              {
                title: "Open Maps, then the Tutorials tab",
                body: "It's on the page you see after signing in.",
              },
              {
                title: "Start Mapped basics",
                body: "Mapped makes a new map called Tutorial map with sample members you can add.",
              },
              {
                title: "Follow the card in the corner",
                body: "You'll add members, colour the map with election results, inspect an area and build a list of marginal seats.",
              },
            ],
            image: TUTORIALS,
          },
          {
            title: "Coming back to it",
            paragraphs: [
              "Close the card at any time; Take the tour in the editor starts it again. The tutorial map is yours to keep or delete when you're done.",
            ],
          },
        ],
        related: ["the-editor", "creating-a-map"],
      },
      {
        slug: "creating-a-map",
        title: "Create a map",
        subtitle: "Start a new map, name it and keep your maps in order.",
        sections: [
          {
            title: "Make a new map",
            steps: [
              {
                title: "Go to Maps",
                body: "Your organisation's maps are listed here.",
              },
              {
                title: "Click New map",
                body: "The map opens in the editor, ready for markers and data.",
              },
              {
                title: "Name it",
                body: "Double-click the map's name at the top of the editor to rename it.",
              },
            ],
          },
          {
            title: "Start from the library",
            paragraphs: [
              "On the Movement Data Library page, Start a map with this makes a new map with that dataset already on it.",
            ],
          },
        ],
        related: ["the-editor", "movement-data-library"],
      },
      {
        slug: "the-editor",
        title: "A tour of the editor",
        subtitle:
          "The sidebar, the views above the map and the inspector, and what each is for.",
        intro: [
          "The editor has three parts: the sidebar on the left, where you choose what's on the map; views across the top, for different set-ups of the same map; and the inspector on the right, which shows what's in the area you click.",
        ],
        sections: [
          {
            title: "The sidebar",
            paragraphs: [
              "**Markers** are people and places, such as members, supporters and venues, each as its own layer with a coloured ring.",
              "**Areas** colours the map. It holds the boundaries for the view, your visualisations, grouped by data source, and your lists of key areas.",
              "**Overlays** adds extra boundary outlines on top, such as regions over constituencies.",
            ],
            image: EDITOR_ELECTION_RESULTS,
          },
          {
            title: "Views",
            paragraphs: [
              "Views are tabs above the map, each its own set-up of the same map. See [Views](/docs/views).",
            ],
          },
          {
            title: "The inspector",
            paragraphs: [
              "Click an area or a marker to open the inspector. See [The inspector](/docs/inspector).",
            ],
          },
          {
            title: "Map style",
            paragraphs: [
              "The layers button on the map switches the map style and turns place labels on or off.",
            ],
          },
        ],
        related: ["marker-layers", "visualisations", "inspector"],
      },
    ],
  },
  {
    title: "Your data",
    description: "Connect your lists and put them on the map.",
    pages: [
      {
        slug: "connecting-data",
        title: "Connect your data",
        subtitle:
          "Bring in members, supporters and places from the tools you already use.",
        intro: [
          "A data source is a list Mapped reads from: your members in a CRM, a spreadsheet of venues, or a CSV. Mapped finds each record's location and keeps it in step with the source.",
        ],
        sections: [
          {
            title: "Add a data source",
            steps: [
              {
                title: "Go to Your data sources and click Connect data",
              },
              {
                title: "Name it and choose its data type",
                body: "Members, People, Locations, Events, Data or Other. Members and people are shown as markers; data such as figures by area colours the map.",
              },
              {
                title: "Choose the source type",
                body: "Action Network, Airtable, Baserow, CSV, Google Sheets, Mailchimp or Zetkin.",
              },
              {
                title: "Click Configure fields",
                body: "Add the details it asks for, such as an API key or the link to a sheet or base.",
              },
              {
                title: "Tell Mapped where each record is",
                body: "Choose the column with a postcode, address, coordinates or an area code (such as a constituency code). This is called geocoding.",
              },
              {
                title: "Import",
                body: "Mapped imports the records and places them on the map. Large lists take a few minutes.",
              },
            ],
            image: DATA_SOURCES,
          },
          {
            title: "Keeping in step",
            paragraphs: [
              "Where the source supports it, Mapped imports changes as they happen, so the map stays up to date without you re-importing.",
            ],
          },
          {
            title: "Which tools are supported",
            paragraphs: [
              "**Action Network**, **Airtable**, **Baserow**, **Google Sheets**, **Mailchimp**, **Zetkin** and **CSV** uploads. Let us know at mapped@commonknowledge.coop if you need another.",
            ],
          },
        ],
        related: ["marker-layers", "columns"],
      },
      {
        slug: "marker-layers",
        title: "Marker layers",
        subtitle: "Show people and places on the map, each in its own colour.",
        sections: [
          {
            title: "Add a layer",
            steps: [
              {
                title: "Click + next to Markers",
                body: "Your data sources are listed under Collections.",
              },
              {
                title: "Choose one",
                body: "It appears on the map and in the sidebar with its own coloured ring.",
              },
            ],
            image: ADD_MARKERS,
          },
          {
            title: "The ring",
            paragraphs: [
              "A layer's coloured ring is its identity: the same ring marks it on the map, in the inspector and anywhere it's used. Click the ring to show or hide the layer.",
              "Right-click a layer for its settings, such as its colour, or to colour the map by how many of its records fall in each area (Create data visualisation).",
            ],
          },
          {
            title: "One-off markers and folders",
            paragraphs: [
              "To mark a single place, such as an event venue, choose Drop a custom marker and click the map, or Search for a place to pin an address or postcode. Custom markers are kept together, and New folder groups them however you like.",
            ],
          },
        ],
        related: ["connecting-data", "inspector"],
      },
      {
        slug: "columns",
        title: "Columns and descriptions",
        subtitle:
          "How Mapped reads your columns, and how to explain them to your team.",
        sections: [
          {
            title: "Column types",
            paragraphs: [
              "Mapped works out whether each column holds numbers or text. Number columns colour areas on a scale from low to high; text columns colour each value its own colour, such as the winning party in each seat.",
            ],
          },
          {
            title: "Descriptions, labels and colours",
            paragraphs: [
              "On a data source's page you can describe a column, give its values readable labels and choose the colour for each value. They show up wherever the column is used, in the colour key and the inspector.",
            ],
          },
        ],
        related: ["visualisations", "connecting-data"],
      },
    ],
  },
  {
    title: "Movement Data Library",
    description: "Public data, ready to map.",
    pages: [
      {
        slug: "movement-data-library",
        title: "The Movement Data Library",
        subtitle:
          "Public data that organisers keep reaching for, ready to put on a map.",
        intro: [
          "The library holds datasets shared for everyone on Mapped, such as the 2024 general election results, so you don't have to find, clean and import them yourself.",
        ],
        sections: [
          {
            title: "Use a dataset",
            steps: [
              {
                title: "Click + next to Areas",
                body: "The data panel lists your own data first, then public data such as the 2024 election results.",
              },
              {
                title: "Choose a dataset",
                body: "It colours the map on its most useful column (for the election results, First party, the winner in each seat).",
              },
              {
                title: "Add more columns",
                body: 'Click "Add a column" under the dataset to show another, such as Lab %.',
              },
            ],
            image: ADD_DATA,
          },
          {
            title: "From the library page",
            paragraphs: [
              "The Movement data library page in the sidebar lists every dataset with what's in it. Start a map with this makes a new map with that dataset on it, and Request data asks us to add one.",
            ],
            image: DATA_LIBRARY,
          },
        ],
        related: ["visualisations", "boundaries"],
      },
    ],
  },
  {
    title: "Areas",
    description: "Colour the map by data, on the boundaries you need.",
    pages: [
      {
        slug: "visualisations",
        title: "Visualisations",
        subtitle: "Colour each area by a column of data.",
        intro: [
          "A visualisation colours the map's areas by one column of a data source, with a colour key underneath. Visualisations sit under Areas, grouped by data source, and are shared by every view of the map.",
        ],
        sections: [
          {
            title: "Add a visualisation",
            steps: [
              {
                title: "Click + next to Areas",
              },
              {
                title: "Choose a data source",
                body: "From the Movement data library or your own data.",
              },
              {
                title: "Choose a column",
                body: "The Column menu groups them into suggested, summaries, numbers and text. Count colours areas by how many records fall in each.",
              },
            ],
            image: EDITOR_ELECTION_RESULTS,
          },
          {
            title: "Switching between them",
            paragraphs: [
              "Click a visualisation to put it on the map; the areas fade from one to the next. Turn it off to go back to plain outlines.",
              "In the inspector, right-click a figure (or use its … button) and choose Add column to data visualisation to colour the map by it.",
            ],
          },
          {
            title: "Members by area",
            paragraphs: [
              "Right-click a marker layer and choose Create data visualisation to shade each area by how many of its records fall there, in the layer's own colour.",
            ],
          },
        ],
        related: ["comparing-columns", "boundaries"],
      },
      {
        slug: "comparing-columns",
        title: "Compare two columns",
        subtitle: "Colour areas by two numbers at once.",
        sections: [
          {
            title: "How it works",
            paragraphs: [
              "With a number column on the map, Compare with another column adds a second. The key becomes a grid: each square is a mix of high and low on both, so you can spot the places where, say, a party's vote is high and your membership is low.",
              "Click a square in the grid to make a list of the areas in it.",
            ],
            image: COMPARING_COLUMNS,
          },
          {
            title: "Turning it off",
            paragraphs: ["Click Stop comparing to go back to one column."],
          },
        ],
        related: ["visualisations", "lists-of-key-areas"],
      },
      {
        slug: "boundaries",
        title: "Boundaries",
        subtitle: "Choose the areas your data is shown on.",
        intro: [
          "Boundaries are the shapes the map is coloured in: constituencies, councils, wards and more. Each view has its boundaries, set at the top of Areas.",
        ],
        sections: [
          {
            title: "What's available",
            paragraphs: [
              "**Parliaments**: Westminster constituencies, and Scottish Parliament and Senedd constituencies and regions.",
              "**Local government**: local authorities and counties, with wards or electoral divisions as you zoom in, and combined authorities.",
              "**Census neighbourhoods**: middle and lower layer super output areas.",
              "**Regions and nations**, and other public boundaries such as health boards.",
            ],
          },
          {
            title: "One set, or one per visualisation",
            paragraphs: [
              "By default every visualisation on a view shares the view's boundaries (the lock at the top of Areas). Unlock it to let a dataset use its own level: keep constituencies for election results, say, and use wards for finer detail elsewhere.",
              "If a dataset can't be shown on the chosen boundaries, the picker says why.",
            ],
            image: BOUNDARIES,
          },
        ],
        related: ["overlay-boundaries", "visualisations"],
      },
      {
        slug: "overlay-boundaries",
        title: "Overlay boundaries",
        subtitle: "Outline a second set of areas on top of your data.",
        sections: [
          {
            title: "Add an overlay",
            paragraphs: [
              "Under Overlays, click + and choose a set of boundaries, such as regions over constituencies. They're drawn as outlines, so the colours underneath still show.",
              "Hover an overlay area to see its name alongside the area underneath.",
            ],
          },
        ],
        related: ["boundaries", "custom-areas"],
      },
      {
        slug: "custom-areas",
        title: "Custom areas",
        subtitle: "Draw your own areas, such as a patch or a canvassing route.",
        sections: [
          {
            title: "Draw an area",
            steps: [
              { title: "Choose Draw area" },
              {
                title: "Click around the area on the map",
                body: "Click the first point again to close the shape.",
              },
              {
                title: "Name it",
                body: "It's kept under custom areas, and the inspector shows who's inside it.",
              },
            ],
          },
        ],
        related: ["inspector", "lists-of-key-areas"],
      },
    ],
  },
  {
    title: "Lists of key areas",
    description: "Keep track of the places you're working on.",
    pages: [
      {
        slug: "lists-of-key-areas",
        title: "Lists of key areas",
        subtitle:
          "Collect the areas you're working on, such as target seats or priority wards.",
        intro: [
          "A list is a set of areas with a name and a colour. Lists sit at the foot of Areas and are outlined on the map in their colour, on their own boundaries, so a list of wards still shows on a map of constituencies.",
        ],
        sections: [
          {
            title: "Make a list from a ranking",
            steps: [
              {
                title:
                  "Click an area, then right-click a figure in the inspector",
                body: "Or use the … button next to it. For example Majority in the election results.",
              },
              {
                title: "Choose Compare across areas",
                body: "Every area is ranked by that figure. Switch to Lowest first to see the most marginal seats.",
              },
              {
                title: "Click Add to list",
                body: "Choose Top 5, 10 or 20, or type a number, and the list is made from the top of the ranking.",
              },
            ],
            image: RANKING,
          },
          {
            title: "Click areas onto a list",
            paragraphs: [
              "Open a list and click Add areas (or click + next to Lists to start a new one), then click areas on the map to add or remove them. Press Escape or Done when you've finished.",
              'From the inspector, Add to list adds the area you\'re looking at to a list, or starts a new one. If a list is on other boundaries, "Pick on the map" switches to them for you.',
            ],
            image: LIST_QUICK_ADD,
          },
          {
            title: "Inside a list",
            paragraphs: [
              "Click a list's name to open it: how many of your members live in its areas, how its data compares with everywhere else, every area in a table you can sort by any column, and everyone who lives there. Click an area or a person to go to them; Back to returns to the list.",
            ],
            image: LIST_INSPECTOR,
          },
        ],
        related: ["comparing-columns", "inspector"],
      },
    ],
  },
  {
    title: "Inspector",
    description: "See what's in an area.",
    pages: [
      {
        slug: "inspector",
        title: "The inspector",
        subtitle:
          "Everything about the area or person you click: data, members and notes.",
        sections: [
          {
            title: "Data tabs",
            paragraphs: [
              "Click an area and the inspector opens with a tab for each data source under Areas, in the same order. Adding data to Areas adds it here too.",
              "Right-click any figure (or use its … button) for its options: Add column to data visualisation, or Compare across areas.",
            ],
            image: INSPECTOR_AREA,
          },
          {
            title: "Markers",
            paragraphs: [
              "The Markers tab lists everyone in the area, layer by layer. Open a person to see their record, then Back to returns to the area.",
            ],
            image: INSPECTOR_MARKERS,
          },
          {
            title: "Notes",
            paragraphs: [
              "The Notes tab keeps notes on a person or place. They're written back to your data source where it supports it, such as Airtable, so the rest of your team sees them there too.",
            ],
          },
          {
            title: "Setting it up",
            paragraphs: [
              "Configure inspector chooses which data sources appear, in which order, and which columns name your records.",
            ],
          },
        ],
        related: ["lists-of-key-areas", "marker-layers"],
      },
    ],
  },
  {
    title: "Views",
    description: "Different set-ups of the same map.",
    pages: [
      {
        slug: "views",
        title: "Views",
        subtitle: "Keep a set-up of the map for each job.",
        intro: [
          "Views are tabs above the map. Each keeps its own layers, boundaries and the visualisation that's on, so you can switch between, say, your members and election results in one click.",
        ],
        sections: [
          {
            title: "Add a view",
            steps: [
              { title: "Click + next to the views" },
              {
                title: "Name it",
                body: "Double-click a view to rename it later.",
              },
            ],
            image: EDITOR_ELECTION_RESULTS,
          },
          {
            title: "What's shared",
            paragraphs: [
              "Your visualisations, lists and inspector settings are shared by every view, so you only set them up once. What's on the map, and its boundaries, belong to each view.",
            ],
          },
        ],
        related: ["visualisations", "the-editor"],
      },
    ],
  },
];
