import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Step } from "react-joyride";

export const multiRouteTourRunAtom = atomWithStorage(
  "multiRouteTour-run",
  false,
);
export const multiRouteTourStepIndexAtom = atomWithStorage(
  "multiRouteTour-stepIndex",
  0,
);
export const multiRouteTourActiveAtom = atomWithStorage(
  "multiRouteTour-active",
  false,
);
export const multiRouteTourStepsAtom = atom<Step[]>([
  {
    target: "body",
    placement: "center",
    data: {
      route: "/dashboard",
    },
    content:
      "Welcome to Mapped! Let's get started, and create a new map. Click next.",
    disableBeacon: true,
  },
  {
    target: "#joyride-recent-maps-button-new-map",
    content: "Click here to create a new map.",
    data: { route: "/dashboard", next: "/map/[id]", disableNext: true },
  },
  {
    target: "body",
    placement: "center",
    data: { route: "/map/[id]" },
    content: "We've created a map, but it's empty. Let's add a data source.",
    disableBeacon: true,
  },
  {
    target: "#joyride-maps-navbar-breadcrumbs-maps",
    data: { route: "/map/[id]", next: "/dashboard", disableNext: true },
    content: "Click here to go back to the dashboard",
  },
  {
    target: "body",
    placement: "center",
    data: { route: "/dashboard" },
    content: "We're back on the dashboard, let's add a data source.",
    disableBeacon: true,
  },
  {
    target: "#joyride-sidebar-data-sources",
    content: "Click to go to the data sources page",
    data: {
      route: "/dashboard",
      next: "/data-sources",
      disableNext: true,
    },
  },
  {
    target: "body",
    placement: "center",
    data: { route: "/data-sources" },
    content:
      "Now we're on the data sources page. Here you can connect Maps up to a range of data providers, but for now we're just going to upload a CSV containing a demo member list.",
    disableBeacon: true,
  },
  {
    target: "#joyride-datasources-addnew",
    content: "Click here to create a new data source",
    data: {
      route: "/data-sources",
      next: "/data-sources/new",
      disableNext: true,
    },
  },
  {
    target: "body",
    placement: "center",
    content: (
      <div>
        Now we&apos;re going to use our CSV to create a new data source. You can{" "}
        <a
          href="/public/demo-member-list_50.csv"
          download
          style={{ color: "#0066cc", textDecoration: "underline" }}
        >
          download a sample CSV file here
        </a>{" "}
        to get started.
      </div>
    ),
    data: { route: "/data-sources/new" },
    disableBeacon: true,
  },
  {
    target: "#joyride-datasources-new-form",
    content:
      "enter a name for the data source, change the type to CSV, and then upload the file you just downloaded.",
    data: { route: "/data-sources/new" },
  },
  {
    target: "#joyride-datasources-new-form-submit",
    content: "Upload the CSV",
    data: {
      route: "/data-sources/new",
      next: "/data-sources/[id]/config",
      disableNext: true,
    },
  },
  {
    target: "body",
    placement: "center",
    content: "Now we need to configure a few things.",
    data: { route: "/data-sources/[id]/config" },
    disableBeacon: true,
  },
  {
    target: "#joyride-datasources-configure",
    content: (
      <div>
        <p>Now we need to configure a few things:</p>
        <ul
          style={{
            marginTop: "10px",
            marginBottom: "10px",
            paddingLeft: "20px",
          }}
        >
          <li>
            Select <strong>&apos;fullname&apos;</strong> for the name column
          </li>
          <li>
            Select <strong>&apos;postcode&apos;</strong> for the location column
          </li>
          <li>
            Set location type to <strong>&apos;UK postcode&apos;</strong>
          </li>
        </ul>
        <p>
          Then click <b>submit</b>
        </p>
      </div>
    ),
    data: {
      route: "/data-sources/[id]/config",
      next: "/data-sources/[id]",
      disableNext: true,
    },
  },
  {
    target: "body",
    placement: "center",
    content: "Now we just need to import the data.",
    data: {
      route: "/data-sources/[id]",
    },
    disableBeacon: true,
  },
  {
    target: "#joyride-datasource-import",
    content: "Click here to import the rows from your CSV, then click next.",
    data: {
      route: "/data-sources/[id]",
    },
  },
  {
    target: "#joyride-sidebar-recent-maps",
    content:
      "Now it's imported, go back to the map you created earlier. Then click the members settings again and select your newly imported data source.",
    data: {
      route: "/data-sources/[id]",
      next: "/dashboard",
      disableNext: true,
    },
  },
]);
