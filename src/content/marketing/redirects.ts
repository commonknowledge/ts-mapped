// Addresses from the old CMS Solutions and Docs, sent to the pages that
// replaced them. Read by next.config.ts, so no "@/" imports here.
const OLD_DOCS: Record<string, string> = {
  "visualise-localities": "/docs/boundaries",
  "basic-map-styling": "/docs/the-editor",
  "organiser-maps": "/docs/creating-a-map",
  "public-map": "/solutions/plan-together",
  "member-lists": "/docs/marker-layers",
  "data-types": "/docs/columns",
  integrations: "/docs/connecting-data",
  "filter-by-data-column": "/docs",
  "send-filtered-list-to-crm": "/docs",
  "filter-by-within-area": "/docs",
  "filter-by-proximity-to-marker": "/docs",
};

const OLD_SOLUTIONS: Record<string, string> = {
  "strategise-with-your-team": "/solutions/map-your-members",
  "geographic-audience-segmentation-for-your-crm":
    "/solutions/target-key-areas",
  "public-maps": "/solutions/plan-together",
};

export const MARKETING_REDIRECTS = [
  { source: "/features", destination: "/solutions", permanent: true },
  ...Object.entries(OLD_DOCS).map(([slug, destination]) => ({
    source: `/docs/${slug}`,
    destination,
    permanent: true,
  })),
  ...Object.entries(OLD_SOLUTIONS).map(([slug, destination]) => ({
    source: `/solutions/${slug}`,
    destination,
    permanent: true,
  })),
];
