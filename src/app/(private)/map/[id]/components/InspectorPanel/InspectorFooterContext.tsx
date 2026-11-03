"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

/**
 * Replaces the inspector Data tab's "Manage inspector data" footer. The
 * light editor provides its in-place Customise controls here.
 */
export const InspectorFooterContext = createContext<ReactNode | null>(null);

export const useInspectorFooterOverride = () =>
  useContext(InspectorFooterContext);
