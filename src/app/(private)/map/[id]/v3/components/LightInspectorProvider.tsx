"use client";

import { InspectorVariantContext } from "../../components/InspectorPanel/InspectorVariantContext";
import { useOpenInspectorSectionEditor } from "../hooks/useInspectorCustomise";
import { useReorderInspectorSource } from "../hooks/useReorderInspectorSource";
import LightInspectorAddSource from "./LightInspectorAddSource";
import LightInspectorSync from "./LightInspectorSync";
import type { ReactNode } from "react";

const renderAddSource = ({ withLabel }: { withLabel: boolean }) => (
  <LightInspectorAddSource withLabel={withLabel} />
);

// Shows one data source at a time in tabs that follow the Areas list: they
// add, reorder and open settings for its sources, so the inspector needs no
// "Manage inspector data" controls of its own
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
      <LightInspectorSync />
      {children}
    </InspectorVariantContext.Provider>
  );
}
