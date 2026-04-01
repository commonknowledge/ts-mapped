import ThumbDark from "@/assets/map/dark.png";
import ThumbLight from "@/assets/map/light.png";
import ThumbSatellite from "@/assets/map/satellite.png";
import ThumbStreets from "@/assets/map/streets.png";
import type { MapStyleName } from "@/models/MapView";
import type { StaticImageData } from "next/image";

export interface MapStyleConfig {
  name: string;
  slug: string;
  textColor: string;
  textHaloColor: string;
  thumbnail: StaticImageData;
}

const mapStyles: Record<MapStyleName, MapStyleConfig> = {
  Light: {
    name: "Light",
    slug: "mapbox/light-v11",
    textColor: "#6D6D6D",
    textHaloColor: "#ffffff",
    thumbnail: ThumbLight,
  },
  Dark: {
    name: "Dark",
    slug: "mapbox/dark-v11",
    textColor: "#ffffff",
    textHaloColor: "#000000",
    thumbnail: ThumbDark,
  },
  Streets: {
    name: "Streets",
    slug: "mapbox/streets-v12",
    textColor: "#6D6D6D",
    textHaloColor: "#ffffff",
    thumbnail: ThumbStreets,
  },
  Satellite: {
    name: "Satellite",
    slug: "mapbox/satellite-v9",
    textColor: "#ffffff",
    textHaloColor: "#000000",
    thumbnail: ThumbSatellite,
  },
};

export const hexMapStyle: MapStyleConfig = {
  name: "Hex",
  slug: "commonknowledge/cmi6buikj00cl01slbvyn7lxc",
  textColor: "#6D6D6D",
  textHaloColor: "#ffffff",
  thumbnail: ThumbLight,
};

export interface mapNodeColor {
  name: string;
  color: string;
}

export interface mapColor {
  name: string;
  color: string;
  textColor?: string;
}

export const mapColors: Record<
  "member" | "dataSource" | "markers" | "areas" | "geography",
  mapColor
> = {
  member: {
    name: "Member",
    color: "#678DE3",
  },
  dataSource: {
    name: "Data Source",
    color: "#FF6B6B",
  },
  geography: {
    name: "Geography",
    color: "#30a46c",
  },
  markers: {
    name: "Markers",
    color: "#FF6B6B",
  },
  areas: {
    name: "Areas",
    color: "#91E17E",
    textColor: "#4DAB37",
  },
};

export interface mapPaletteColor {
  name: string;
  color: string;
}

export const DEFAULT_SECONDARY_BOUNDARY_STROKE_COLOR = "#555555";

export const mapColorPalette: mapPaletteColor[] = [
  // Existing named UI colours
  { name: mapColors.member.name, color: mapColors.member.color },
  { name: mapColors.dataSource.name, color: mapColors.dataSource.color },
  {
    name: mapColors.areas.name,
    color: mapColors.areas.textColor ?? mapColors.areas.color,
  },

  // Neutrals
  { name: "Slate", color: DEFAULT_SECONDARY_BOUNDARY_STROKE_COLOR },
  { name: "Black", color: "#000000" },
  { name: "White", color: "#ffffff" },

  // Extra palette options (good contrast on light maps)
  { name: "Royal blue", color: "#00749e" },
  { name: "Purple", color: "#c026d3" },
  { name: "Orange", color: "#ef5f00" },
  { name: "Red", color: "#dc3b5d" },
  { name: "Teal", color: "#0f766e" },
  { name: "Indigo", color: "#4f46e5" },
  { name: "Amber", color: "#d97706" },
];

export const CONTROL_PANEL_WIDTH = 280;
export const VISUALISATION_PANEL_WIDTH = 300;

export default mapStyles;

export interface PublicMapColorScheme {
  primary: string;
  primaryMuted: string;
  secondary?: string;
  secondaryMuted?: string;
}

export const publicMapColorSchemes: Record<string, PublicMapColorScheme> = {
  red: {
    primary: "#FF6B6B",
    primaryMuted: "#FFF6F6",
  },
  blue: {
    primary: "#678DE3",
    primaryMuted: "#F5F8FD",
  },
  green: {
    primary: "#4DAB37",
    primaryMuted: "#F4FAF2",
  },
  ["trans-pride"]: {
    primary: "#92C7DC",
    primaryMuted: "#F6FDFF",
    secondary: "FDF3F9",
    secondaryMuted: "#FDF3F9",
  },
};
