export interface ManifestFeature {
  slug: string;
  title: string;
  subtitle?: string;
  hint: string;
}

export interface ManifestFeatureSet {
  slug: string;
  title: string;
  description?: string;
  order: number;
  features: ManifestFeature[];
}

export const manifest: ManifestFeatureSet[] = [
  {
    slug: "getting-started",
    title: "Getting Started",
    description: "Everything you need to get up and running with Mapped.",
    order: 1,
    features: [
      {
        slug: "create-a-map",
        title: "Create a Map",
        subtitle: "Build your first interactive map in minutes.",
        hint: "Walk through creating a new map, configuring its title and settings, and publishing it.",
      },
      {
        slug: "invite-team-members",
        title: "Invite Team Members",
        subtitle: "Collaborate with your organisation.",
        hint: "Explain how to invite colleagues to an organisation and manage their roles.",
      },
    ],
  },
  {
    slug: "data-sources",
    title: "Data Sources",
    description: "Connect your data to Mapped from a variety of sources.",
    order: 2,
    features: [
      {
        slug: "upload-csv",
        title: "Upload a CSV",
        subtitle: "Import data from a CSV file.",
        hint: "How to upload a CSV, map columns to location fields, and geocode addresses.",
      },
      {
        slug: "connect-airtable",
        title: "Connect Airtable",
        subtitle: "Sync your Airtable base into Mapped.",
        hint: "Step-by-step guide to connecting an Airtable base, selecting the right table, and mapping address or coordinates fields.",
      },
      {
        slug: "connect-google-sheets",
        title: "Connect Google Sheets",
        subtitle: "Import data directly from Google Sheets.",
        hint: "How to link a Google Sheet, authenticate, and keep data in sync.",
      },
      {
        slug: "connect-mailchimp",
        title: "Connect Mailchimp",
        subtitle: "Import data directly from Mailchimp.",
        hint: "How to link a Mailchimp account, authenticate, and keep data in sync.",
      },
      {
        slug: "connect-action-network",
        title: "Connect Action Network",
        subtitle: "Sync your Action Network account into Mapped.",
        hint: "How to link an Action Network account, authenticate, and sync your data into Mapped.",
      },
      {
        slug: "connect-zetkin",
        title: "Connect Zetkin",
        subtitle: "Sync your Zetkin account into Mapped.",
        hint: "How to link a Zetkin account, authenticate, and sync your data into Mapped.",
      },
    ],
  },
  {
    slug: "map-layers",
    title: "Map Layers",
    description: "Visualise your data with powerful map layer types.",
    order: 3,
    features: [
      {
        slug: "markers-layer",
        title: "Markers",
        subtitle: "Plot individual records as markers on the map.",
        hint: "How to add a markers layer, style markers using the right click context menu. Explain the difference between marker collections that come from data sources and individaul markers that you can add from mapped.",
      },
      {
        slug: "areas-layer",
        title: "Areas",
        subtitle: "Draw custom areas on the map.",
        hint: "How to add an areas layer and adjust the styling of the areas. This is useful for filtering down datasources to show what's with in this area. As well as drawing, you're able to add boundaries from the data viusaliser to your areas list via a button in the inspector.",
      },
    ],
  },
  {
    slug: "data-visualisation",
    title: "Data Visualisation",
    description: "Colour boundary maps using your data.",
    order: 4,
    features: [
      {
        slug: "data-visualisation-panel",
        title: "The Data Visualisation Panel",
        subtitle: "Open and navigate the visualisation panel.",
        hint: "The Data Visualisation panel sits on the right side of the map editor and opens when you click the paintbrush icon in the Data Visualisation layer control on the left. Explain: what the panel contains — layout selector (Geographic vs Hex Map), colour scale type selector, colour scheme picker, reverse toggle, opacity slider; and that the Style section only appears once a data source and column have been chosen in the Legend.",
      },
      {
        slug: "colour-a-boundary-by-data",
        title: "Colour a Boundary by Data",
        subtitle: "Create a choropleth to colour regions by a numeric value.",
        hint: "Step-by-step: open the Data Visualisation layer in the left panel, pick a boundary type (e.g. Westminster constituencies, local authority districts) from the Legend, select a connected data source and the numeric column to colour by. The boundary regions update immediately. Explain how to change the colour scheme (Sequential, Red-Blue, Viridis, Diverging, Custom) and adjust opacity using the slider in the Visualisation Panel.",
      },
      {
        slug: "stepped-colour-scale",
        title: "Stepped Colour Scale",
        subtitle: "Define custom break points for discrete colour bands.",
        hint: "How to switch from a gradient to a stepped colour scale in the Visualisation Panel. Explain the interactive break-point editor: range sliders define where colour bands change, the end of one step equals the start of the next. You can add or remove steps. Useful when you want to highlight specific thresholds (e.g. above/below a target) rather than a smooth gradient.",
      },
      {
        slug: "bivariate-visualisation",
        title: "Bivariate Visualisation",
        subtitle: "Compare two data columns using a 3×3 colour matrix.",
        hint: "How to enable bivariate mode by selecting a secondary column in the Legend. Explain the 3×3 colour grid: the horizontal axis represents the primary column value (low/mid/high) and the vertical axis represents the secondary column value. Each cell gets a distinct colour from the bivariate colour matrix. Users can click a cell in the Inspector's bivariate grid to filter the map to show only boundaries in that bucket. Good for showing correlation — e.g. high membership AND high deprivation.",
      },
      {
        slug: "count-records-in-boundary",
        title: "Count Records Within a Boundary",
        subtitle: "Colour boundaries by how many markers fall inside each region.",
        hint: "How to colour boundaries by the count of data records (e.g. members) within each boundary rather than a column value. Select a marker data source in the Legend and choose 'Count' as the aggregation method. The backend aggregates markers against the loaded boundary geometry. Useful for density maps. This works with both your own data sources and Movement Data Library data.",
      },
    ],
  },
  {
    slug: "inspector",
    title: "Inspector",
    description: "Drill into the details of any boundary, marker, or area.",
    order: 5,
    features: [
      {
        slug: "using-the-inspector",
        title: "Using the Inspector",
        subtitle: "Click any map element to open the Inspector.",
        hint: "How to open the Inspector panel by clicking a boundary, marker, or custom area on the map. The panel appears in the top-right. Explain what it shows for each type: for boundaries — name, boundary code, choropleth value, and an 'Add to areas' button; for markers — name, location, and data record field values from connected data sources; for clusters (multiple markers at the same point) — a count and list; for custom areas — the area name and a list of markers within it. Mention the Data tab vs Markers tab.",
      },
      {
        slug: "configure-inspector-data",
        title: "Configuring the Data Tab",
        subtitle: "Choose which data sources appear in the Inspector.",
        hint: "How to customise which data sources are shown in the Inspector's Data tab and in what order. Click the settings icon within the Data tab to open the Inspector Data Config. Each connected data source can be toggled on or off and reordered by drag. Useful when you have many data sources and only want to focus on the most relevant ones.",
      },
      {
        slug: "add-boundary-to-areas",
        title: "Add a Boundary to Areas",
        subtitle: "Turn a selected boundary into a custom area for filtering.",
        hint: "How to click a boundary on the map, open the Inspector, and use the 'Add to areas' button to save it as a custom area. Custom areas appear in the Areas layer and can be used to filter marker data sources to show only records within that area. Explain that this is useful for carving out a custom region that does not match an existing boundary type.",
      },
    ],
  },
  {
    slug: "movement-data-library",
    title: "Movement Data Library",
    description: "Access data from the Movement Data Library.",
    order: 6,
    features: [
      {
        slug: "access-movement-data-library",
        title: "Access Movement Data Library",
        subtitle: "Access data from the Movement Data Library.",
        hint: "How to access the data sources from the Movement Data Library and add them to your map.",
      },
      {
        slug: "add-movement-data-library-data-to-your-map",
        title: "Add Movement Data Library Data to Your Map",
        subtitle: "Add data from the Movement Data Library to your map.",
        hint: "How to add data from the Movement Data Library to your map.",
      },
    ],
  },
  {
    slug: "publishing",
    title: "Publishing & Sharing",
    description: "Share your maps with the world or keep them private.",
    order: 7,
    features: [
      {
        slug: "publish-a-map",
        title: "Publish a Map",
        subtitle: "Make your map publicly accessible.",
        hint: "How to publish a map, set visibility, configure the public URL, and embed it on a website.",
      },
    ],
  },
];
