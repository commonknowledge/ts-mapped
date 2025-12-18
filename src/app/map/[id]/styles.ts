import ThumbDark from "@/assets/map/dark.png";
import ThumbLight from "@/assets/map/light.png";
import ThumbSatellite from "@/assets/map/satellite.png";
import ThumbStreets from "@/assets/map/streets.png";
import type { MapStyleName } from "@/server/models/MapView";
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
  "member" | "dataSource" | "markers" | "areas",
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

export const CONTROL_PANEL_WIDTH = 280;

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
    primaryMuted: "#FF6B6B10",
  },
  blue: {
    primary: "#678DE3",
    primaryMuted: "#678DE310",
  },
  green: {
    primary: "#4DAB37",
    primaryMuted: "#4DAB3710",
  },
  ["trans-pride"]: {
    primary: "#92C7DC",
    primaryMuted: "#F6FDFF",
    secondary: "FDF3F9",
    secondaryMuted: "#FDF3F9",
  },
};
