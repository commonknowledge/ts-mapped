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
    slug: "light-v11",
    textColor: "#6D6D6D",
    textHaloColor: "#ffffff",
    thumbnail: ThumbLight,
  },
  Dark: {
    name: "Dark",
    slug: "dark-v11",
    textColor: "#ffffff",
    textHaloColor: "#000000",
    thumbnail: ThumbDark,
  },
  Streets: {
    name: "Streets",
    slug: "streets-v12",
    textColor: "#6D6D6D",
    textHaloColor: "#ffffff",
    thumbnail: ThumbStreets,
  },
  Satellite: {
    name: "Satellite",
    slug: "satellite-v9",
    textColor: "#ffffff",
    textHaloColor: "#000000",
    thumbnail: ThumbSatellite,
  },
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

export const publicMapColourSchemes: Record<
  string,
  {
    primary: string;
    muted: string;
  }
> = {
  red: {
    primary: "#FF6B6B",
    muted: "#FF6B6B10",
  },
  blue: {
    primary: "#678DE3",
    muted: "#678DE310",
  },
  green: {
    primary: "#4DAB37",
    muted: "#4DAB3710",
  },
};
