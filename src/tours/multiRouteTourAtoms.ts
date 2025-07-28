import { atom } from "jotai";
import { Step } from "react-joyride";

export const multiRouteTourRunAtom = atom(false);
export const multiRouteTourStepIndexAtom = atom(0);
export const multiRouteTourActiveAtom = atom(false);
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
    data: { route: "/map/[id]", previous: "/dashboard" },
    content: "We've created a map, but it's empty. Let's add a data source.",
    disableBeacon: true,
  },
  {
    target: "#joyride-maps-navbar-breadcrumbs-maps",
    data: { route: "/map/[id]", next: "/dashboard" },
    content: "Click here to go back to the dashboard",
  },
  {
    target: "body",
    placement: "center",
    data: { route: "/dashboard", previous: "back" },
    content: "We're back on the dashboard, let's add a data source.",
    disableBeacon: true,
  },
  {
    target: "#joyride-sidebar-data-sources",
    content: "Click to go to the data sources page",
    data: { route: "/dashboard", next: "/data-sources", previous: "/map/[id]", disableNext: true },
  },
  {
    target: "body",
    placement: "center",
    data: { route: "/data-sources", previous: "/dashboard" },
    content:
      "Now we're on the data sources page. Here you can connect Maps up to a range of data providers, but for now we're just going to upload a CSV containing a demo member list.",
    disableBeacon: true,
  },
  {
    target: "#joyride-datasources-addnew",
    content: "Click here to create a new data source",
    data: { route: "/data-sources", previous: "/dashboard" },
  },
  {
    target: "#data-sources-tour-start",
    content:
      "This is the data sources page. Click back to return to Dashboard.",
    data: { route: "/data-sources", previous: "/dashboard" },
    disableBeacon: true,
  },
  {
    target: "#data-sources-tour-start",
    content: "Finisht the tour",
    data: { route: "/data-sources", previous: "/dashboard" },
    disableBeacon: true,
  },
]);
