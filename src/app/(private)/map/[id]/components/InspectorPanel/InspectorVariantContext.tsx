"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

/**
 * How the inspector's Data tab lays out its data sources. "classic" stacks
 * collapsible sections; "light" (the v3 editor) shows one source at a time
 * in tabs, leading with key figures, and opens source settings through
 * `onConfigureSource` instead of a modal.
 */
export const InspectorVariantContext = createContext<{
  variant: "classic" | "light";
  onConfigureSource?: (dataSourceId: string) => void;
  /** A control at the end of the source tabs for adding another source */
  renderAddSource?: (options: { withLabel: boolean }) => ReactNode;
  /** Reorders sources by dragging their tabs (defaults to the inspector's
   *  own order) */
  onReorderSource?: (dataSourceId: string, targetDataSourceId: string) => void;
}>({ variant: "classic" });

export const useInspectorVariant = () => useContext(InspectorVariantContext);

/**
 * In the light inspector, tabs that sit after the data source tabs in the
 * same row (Markers, Notes), in place of a separate row of top-level tabs
 */
export const InspectorExtraTabsContext = createContext<
  { id: string; label: string; count?: number; content: ReactNode }[]
>([]);
