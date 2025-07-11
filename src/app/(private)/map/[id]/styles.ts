import { MapStyleName } from "@/__generated__/types";

export interface MapStyleConfig {
  name: string;
  slug: string;
  textColor: string;
  textHaloColor: string;
}

const mapStyles: Record<MapStyleName, MapStyleConfig> = {
  Light: {
    name: "Light",
    slug: "light-v11",
    textColor: "#6D6D6D",
    textHaloColor: "#ffffff",
  },
  Dark: {
    name: "Dark",
    slug: "dark-v11",
    textColor: "#ffffff",
    textHaloColor: "#000000",
  },
  Streets: {
    name: "Streets",
    slug: "streets-v12",
    textColor: "#6D6D6D",
    textHaloColor: "#ffffff",
  },
  Satellite: {
    name: "Satellite",
    slug: "satellite-v9",
    textColor: "#ffffff",
    textHaloColor: "#000000",
  },
};

export interface mapNodeColor {
  name: string;
  color: string;
}

export const mapNodeColors: Record<"marker" | "searched", mapNodeColor> = {
  marker: {
    name: "Marker",
    color: "#678DE3",
  },
  searched: {
    name: "Searched",
    color: "#FF6B6B",
  },
};

export default mapStyles;

export interface mapColor {
  name: string;
  color: string;
  textColor?: string;
}

export const mapColours: Record<string, mapColor> = {
  member: {
    name: "Member",
    color: "#678DE3",
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
