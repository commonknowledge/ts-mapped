import {
  ADD_MARKERS,
  BOUNDARIES,
  COMPARING_COLUMNS,
  DATA_LIBRARY,
  DATA_SOURCES,
  EDITOR_ELECTION_RESULTS,
  INSPECTOR_MARKERS,
  LIST_INSPECTOR,
  RANKING,
} from "./images";
import type { Solution } from "./types";

export const SOLUTIONS: Solution[] = [
  {
    slug: "map-your-members",
    title: "Map your members",
    subtitle:
      "See where your members and supporters are, straight from the tools you already use.",
    summary: "Your members and places on a map, synced from your CRM.",
    status: "available",
    items: [
      {
        title: "Bring in your members from your CRM",
        paragraphs: [
          "Connect Action Network, Airtable, Baserow, Google Sheets, Mailchimp or Zetkin, or upload a CSV. Mapped finds each record's location from its postcode, address or coordinates and keeps it in step with the source.",
          "Each list becomes a marker layer on your map, so you can see at a glance where you're strong and where you're thin on the ground.",
        ],
        image: DATA_SOURCES,
        docSlug: "connecting-data",
      },
      {
        title: "Add the places that matter",
        paragraphs: [
          "Put community centres, venues, workplaces or campaign offices on the map as their own layers, or drop a one-off marker anywhere.",
          "Every layer has its own coloured ring, used on the map, in the inspector and wherever the layer appears, so you always know what you're looking at.",
        ],
        image: ADD_MARKERS,
        docSlug: "marker-layers",
      },
      {
        title: "Who's in this area?",
        paragraphs: [
          "Click any area to open the inspector. Its Markers tab lists everyone who lives there, layer by layer; open a person to see their record.",
          "Keep notes on a person or place in the inspector. They're written back to your data source where it supports it, such as Airtable, so the whole team sees them.",
        ],
        image: INSPECTOR_MARKERS,
        docSlug: "inspector",
      },
    ],
  },
  {
    slug: "understand-your-areas",
    title: "Understand your areas",
    subtitle:
      "Colour the map with election results, census figures or your own data to see the places behind the numbers.",
    summary: "Election results, census figures and your own data, by area.",
    status: "available",
    items: [
      {
        title: "Data that's ready to use",
        paragraphs: [
          "The Movement Data Library holds public data that organisers keep reaching for, such as the 2024 general election results, ready to put on a map in a click.",
          "Library data opens on its most useful column (for the election results, the winning party in each seat), and you can add more columns as you go.",
        ],
        image: DATA_LIBRARY,
        docSlug: "movement-data-library",
      },
      {
        title: "The right boundaries for the job",
        paragraphs: [
          "Show data on Westminster constituencies, Scottish and Welsh parliament seats, councils, wards, county divisions, combined authorities, regions or census neighbourhoods.",
          "Every visualisation on a view shares one set of boundaries by default; unlock them to give one dataset its own level of detail.",
        ],
        image: BOUNDARIES,
        docSlug: "boundaries",
      },
      {
        title: "Compare two things at once",
        paragraphs: [
          "Colour areas by two numeric columns together, such as a party's vote share and your membership, to find the places where both are high or both are low.",
          "Switch between columns and views and the map fades from one to the next, so changes are easy to follow.",
        ],
        image: COMPARING_COLUMNS,
        docSlug: "comparing-columns",
      },
    ],
  },
  {
    slug: "target-key-areas",
    title: "Target key areas",
    subtitle:
      "Build lists of the places you're working on, such as marginal seats or priority wards, and see who and what is in them.",
    summary: "Lists of target seats and wards, with the members in each.",
    status: "available",
    items: [
      {
        title: "Find your targets",
        paragraphs: [
          "Rank every area by a figure, such as lowest majority first, and make a list from the top of the ranking in one go.",
          "Or click areas straight onto a list with quick add, or add the area you're looking at from the inspector.",
        ],
        image: RANKING,
        docSlug: "lists-of-key-areas",
      },
      {
        title: "See inside a list",
        paragraphs: [
          "A list shows how many of your members live in its areas, how its data compares with everywhere else, every area in a table you can sort, and everyone who lives there.",
          "Lists are outlined on the map in their own colour, on their own boundaries, so you can keep a list of wards on a map of constituencies.",
        ],
        image: LIST_INSPECTOR,
        docSlug: "lists-of-key-areas",
      },
    ],
  },
  {
    slug: "plan-together",
    title: "Plan together",
    subtitle:
      "Keep a map for each job, work from it as a team, and share it with the people you organise with.",
    summary: "Views for each job, shared notes, and public maps soon.",
    status: "available",
    items: [
      {
        title: "A view for each job",
        paragraphs: [
          "Views are different set-ups of the same map: your members on one, election results on another, a target list on a third. Switch between them above the map.",
          "The visualisations you build are shared by every view, so you only set things up once.",
        ],
        image: EDITOR_ELECTION_RESULTS,
        docSlug: "views",
      },
      {
        title: "Public maps, coming soon",
        paragraphs: [
          "Soon you'll be able to share a map with your team or another organisation, and publish a public map to show supporters where your campaign is growing and where to get involved.",
        ],
      },
    ],
  },
];
