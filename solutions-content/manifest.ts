export interface SolutionItem {
  title: string;
  description: string; // newline-separated paragraphs, rendered as <p> per line
  image?: string; // path relative to /public, e.g. /solutions/local-organising/map-view.png
  button?: {
    text: string;
    linkType: "external" | "docs";
    url?: string;
    docsSlug?: string;
  };
}

export interface Solution {
  slug: string;
  title: string;
  subtitle: string;
  status: "active" | "coming-soon" | "archived";
  position: number;
  items: SolutionItem[];
}

export const solutions: Solution[] = [
  {
    slug: "local-organising",
    title: "Local Organising",
    subtitle: "Map your members, supporters, and activity across your area.",
    status: "active",
    position: 1,
    items: [
      {
        title: "See where your people are",
        description:
          "Import your membership list from Airtable, Google Sheets, or a CSV and plot every member on an interactive map. Instantly understand which neighbourhoods have strong turnout and which need more attention.\n\nFilter by custom areas — draw a ward boundary or import a constituency outline — and Mapped will show only the members within it.",
        button: {
          text: "Connect a data source",
          linkType: "docs",
          docsSlug: "upload-csv",
        },
      },
      {
        title: "Count members by boundary",
        description:
          "Colour local authority districts, wards, or parliamentary constituencies by how many of your members live within each one. A single glance reveals your strongest and weakest areas.\n\nCombine your membership data with publicly available data from the Movement Data Library — for example, overlaying deprivation scores against membership density — to prioritise where to focus your organising.",
        button: {
          text: "Learn about choropleth maps",
          linkType: "docs",
          docsSlug: "colour-a-boundary-by-data",
        },
      },
      {
        title: "Define your territories",
        description:
          "Draw custom areas on the map to carve out organising zones, branches, or campaign territories. Any markers layer will automatically filter to show only the records within your defined areas.\n\nYou can also convert any official boundary — a ward, a constituency — into a custom area with one click from the Inspector.",
        button: {
          text: "Learn about areas",
          linkType: "docs",
          docsSlug: "areas-layer",
        },
      },
    ],
  },
  {
    slug: "electoral-campaigns",
    title: "Electoral Campaigns",
    subtitle:
      "Visualise voter data, canvassing activity, and results by constituency.",
    status: "active",
    position: 2,
    items: [
      {
        title: "Map your canvassing data",
        description:
          "Connect your canvassing returns from Airtable or a CSV and see exactly where your volunteers have been and what responses they've collected. Spot gaps in coverage and direct your teams accordingly.\n\nClicking any marker opens the Inspector, showing the full data record — door number, responses, follow-up flags — without leaving the map.",
        button: {
          text: "Connect Airtable",
          linkType: "docs",
          docsSlug: "connect-airtable",
        },
      },
      {
        title: "Choropleth by constituency",
        description:
          "Colour parliamentary constituencies or council wards by vote share, swing, majority, or any column in your data. Use a diverging colour scale to show where you're ahead or behind.\n\nSwitch to bivariate mode to cross-reference two variables at once — for example, swing versus turnout — and immediately see which seats are both winnable and high-priority.",
        button: {
          text: "Learn about bivariate maps",
          linkType: "docs",
          docsSlug: "bivariate-visualisation",
        },
      },
      {
        title: "Publish results maps",
        description:
          "On election night or the morning after, publish a results map with a single toggle. Anyone with the link can explore the map — zooming in, clicking constituencies, seeing the numbers — with no Mapped account required.\n\nEmbed the map directly on your campaign website using the generated iframe code.",
        button: {
          text: "Learn about publishing",
          linkType: "docs",
          docsSlug: "publish-a-map",
        },
      },
    ],
  },
  {
    slug: "movement-data-library",
    title: "Movement Data Library",
    subtitle:
      "Access curated public datasets to add context to your organising maps.",
    status: "active",
    position: 3,
    items: [
      {
        title: "Ready-made data, no sourcing required",
        description:
          "The Movement Data Library is a curated collection of publicly available datasets — deprivation indices, demographic breakdowns, electoral results, and more — maintained and updated by Mapped.\n\nAdd any dataset to your organisation in one click. It becomes available as a data source in all your maps, just like data you've connected yourself.",
        button: {
          text: "Browse the library",
          linkType: "docs",
          docsSlug: "access-movement-data-library",
        },
      },
      {
        title: "Combine with your own data",
        description:
          "MDL datasets become most powerful when layered against your own. Use bivariate mode to cross-reference a deprivation index against your membership density — revealing which high-need areas you're not yet reaching.\n\nOr count how many of your members fall within each boundary and compare it to a publicly available population figure to calculate a penetration rate.",
        button: {
          text: "Learn about bivariate maps",
          linkType: "docs",
          docsSlug: "bivariate-visualisation",
        },
      },
      {
        title: "Built for movement organisations",
        description:
          "The library is curated with social movement use cases in mind: tenant organisers, climate campaigners, trade unions, and electoral campaigns. We prioritise datasets that help you understand power, need, and opportunity in your area.\n\nIf there's a dataset you'd like to see added, get in touch — we regularly expand the library based on organiser feedback.",
        button: {
          text: "Contact us",
          linkType: "external",
          url: "mailto:mapped@commonknowledge.coop",
        },
      },
    ],
  },
  {
    slug: "coalition-building",
    title: "Coalition Building",
    subtitle: "Coordinate across organisations and share maps with your allies.",
    status: "active",
    position: 4,
    items: [
      {
        title: "A shared map for your coalition",
        description:
          "Invite multiple organisations into a single Mapped workspace. Each can connect their own data sources — members, venues, canvassing returns — and see the combined picture on one map.\n\nPermissions ensure each organisation only edits their own data, while everyone benefits from the shared view.",
        button: {
          text: "Invite team members",
          linkType: "docs",
          docsSlug: "invite-team-members",
        },
      },
      {
        title: "Publish maps for your campaign",
        description:
          "Create a publicly accessible map to share with supporters, media, or partner organisations. Anyone with the link can explore it — no account needed.\n\nEmbed the map on a campaign website to show your coalition's geographic reach and the communities you're working with.",
        button: {
          text: "Learn about publishing",
          linkType: "docs",
          docsSlug: "publish-a-map",
        },
      },
    ],
  },
];
