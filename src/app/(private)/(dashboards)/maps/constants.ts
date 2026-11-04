import {
  DatabaseIcon,
  MapIcon,
  PaletteIcon,
  PanelRightIcon,
  Share2Icon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// The tutorials on the Maps page. Each runs on its own tutorial map; only
// those marked available can be started yet.
export const TUTORIALS: {
  id: string;
  title: string;
  description: string;
  length: string;
  icon: LucideIcon;
  isAvailable: boolean;
}[] = [
  {
    id: "basics",
    title: "Mapped basics",
    description:
      "Build a map from scratch: add members and your own markers, colour the map by election results, look inside an area and save views.",
    length: "About 5 minutes",
    icon: MapIcon,
    isAvailable: true,
  },
  {
    id: "data",
    title: "Bring in your own data",
    description:
      "Connect member lists and other data from Action Network, Airtable, Google Sheets, Mailchimp and more, and keep them in sync.",
    length: "Coming soon",
    icon: DatabaseIcon,
    isAvailable: false,
  },
  {
    id: "inspector",
    title: "Set up the inspector",
    description:
      "Choose what the inspector shows for each data source: columns, pinned key figures, formats and Auto-scan.",
    length: "Coming soon",
    icon: PanelRightIcon,
    isAvailable: false,
  },
  {
    id: "styling",
    title: "Style your map",
    description:
      "Colour scales, marker styles and sizes, outline boundaries and custom areas.",
    length: "Coming soon",
    icon: PaletteIcon,
    isAvailable: false,
  },
  {
    id: "sharing",
    title: "Share and publish",
    description:
      "Share a map with your team or another organisation, and publish a public map.",
    length: "Coming soon",
    icon: Share2Icon,
    isAvailable: false,
  },
];

// The Maps page's tabs, as kept in the URL (?tab=)
export const MAPS_TABS = { maps: "maps", tutorials: "tutorials" } as const;
