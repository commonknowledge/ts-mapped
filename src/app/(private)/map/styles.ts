export interface MapStyle {
  name: string;
  slug: string;
  textColor: string;
  textHaloColor: string;
}

const mapStyles: Record<string, MapStyle> = {
  "streets-v12": {
    name: "Streets",
    slug: "streets-v12",
    textColor: "#6D6D6D",
    textHaloColor: "#ffffff",
  },
  "light-v11": {
    name: "Light",
    slug: "light-v11",
    textColor: "#6D6D6D",
    textHaloColor: "#ffffff",
  },
  "dark-v11": {
    name: "Dark",
    slug: "dark-v11",
    textColor: "#ffffff",
    textHaloColor: "#000000",
  },
  "satellite-v9": {
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
