"use client";

import React, { createContext, useContext } from "react";
import type { Feature, FeatureSet } from "@/app/(marketing)/types";

interface FeatureSetsWithFeatures extends FeatureSet {
  features: Feature[];
}

interface FeaturesContextType {
  featureSetsWithFeatures: FeatureSetsWithFeatures[];
}

const FeaturesContext = createContext<FeaturesContextType | undefined>(
  undefined,
);

export function FeaturesProvider({
  children,
  featureSetsWithFeatures,
}: {
  children: React.ReactNode;
  featureSetsWithFeatures: FeatureSetsWithFeatures[];
}) {
  return (
    <FeaturesContext.Provider value={{ featureSetsWithFeatures }}>
      {children}
    </FeaturesContext.Provider>
  );
}

export function useFeatures() {
  const context = useContext(FeaturesContext);
  if (context === undefined) {
    throw new Error("useFeatures must be used within a FeaturesProvider");
  }
  return context;
}
