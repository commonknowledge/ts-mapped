"use client";

import { useState } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import type { InspectorContent } from "@/app/map/[id]/context/InspectorContext";
import type { ReactNode } from "react";

const InspectorProvider = ({ children }: { children: ReactNode }) => {
  const [inspectorContent, setInspectorContent] =
    useState<InspectorContent | null>(null);

  const resetInspector = () => {
    setInspectorContent(null);
  };

  const navigateToParent = () => {
    if (inspectorContent?.parent) {
      // Create a new inspector content with the parent information
      const parentContent: InspectorContent = {
        type: inspectorContent.parent.type,
        name: inspectorContent.parent.name,
        properties: null,
        dataSource: null,
        id: inspectorContent.parent.id,
      };
      setInspectorContent(parentContent);
    } else {
      resetInspector();
    }
  };

  return (
    <InspectorContext.Provider
      value={{
        inspectorContent,
        setInspectorContent,
        resetInspector,
        navigateToParent,
      }}
    >
      {children}
    </InspectorContext.Provider>
  );
};

export default InspectorProvider;
