"use client";

import { InspectorFooterContext } from "../../components/InspectorPanel/InspectorFooterContext";
import { InspectorVariantContext } from "../../components/InspectorPanel/InspectorVariantContext";
import { useOpenInspectorSectionEditor } from "../hooks/useInspectorCustomise";
import { useReorderInspectorSource } from "../hooks/useReorderInspectorSource";
import LightInspectorAddSource from "./LightInspectorAddSource";
import LightInspectorFooter from "./LightInspectorFooter";
import LightInspectorSync from "./LightInspectorSync";
import type { ReactNode } from "react";

const renderAddSource = ({ withLabel }: { withLabel: boolean }) => (
  <LightInspectorAddSource withLabel={withLabel} />
);

// Swaps the inspector's "Manage inspector data" dialog for the in-place
// Customise controls, shows one data source at a time in tabs, and keeps
// its sections following the Areas list
export default function LightInspectorProvider({
  children,
}: {
  children: ReactNode;
}) {
  const openSectionEditor = useOpenInspectorSectionEditor();
  const reorderSource = useReorderInspectorSource();
  return (
    <InspectorVariantContext.Provider
      value={{
        variant: "light",
        onConfigureSource: openSectionEditor,
        renderAddSource: renderAddSource,
        onReorderSource: reorderSource,
      }}
    >
      <InspectorFooterContext.Provider value={<LightInspectorFooter />}>
        <LightInspectorSync />
        {children}
      </InspectorFooterContext.Provider>
    </InspectorVariantContext.Provider>
  );
}
