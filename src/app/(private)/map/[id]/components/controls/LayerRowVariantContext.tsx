"use client";

import { createContext, useContext } from "react";

/**
 * How layer rows (ControlWrapper) draw their colour and visibility:
 * "classic" has a colour bar and hover buttons; "light" (the v3 editor) has
 * an editable colour swatch and a compact visibility toggle on the right.
 */
export const LayerRowVariantContext = createContext<"classic" | "light">(
  "classic",
);

export const useLayerRowVariant = () => useContext(LayerRowVariantContext);
