import { createContext } from "react";

export const HoverAreaContext = createContext<{
  hoverAreaCode: { coordinates: [number, number]; code: string } | null;
  setHoverAreaCode: (
    a: {
      coordinates: [number, number];
      code: string;
    } | null
  ) => void;
}>({
  hoverAreaCode: null,
  setHoverAreaCode: () => null,
});
