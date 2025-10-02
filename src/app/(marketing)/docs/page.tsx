"use client";

import React from "react";
import { Link } from "@/components/Link";
import {
  TypographyH1,
  TypographyH2,
  TypographyLead,
  TypographyMuted,
  TypographyP,
} from "@/components/typography";
import { useFeatures } from "./FeaturesContext";
import type { Feature, FeatureSet } from "@/app/(marketing)/types";
import RichTextComponent from "../components/RichTextComponent";

export default function FeaturesPage() {
  const { featureSetsWithFeatures } = useFeatures();

  const activeFeatureSets = featureSetsWithFeatures.filter((featureSet) => featureSet.features && featureSet.features.length > 0);
  return (
    <div className="max-w-4xl">
      {/* Header */}
      <TypographyMuted className="mb-4">Docs</TypographyMuted>

      <TypographyH1>Mapped Documentation</TypographyH1>

      <TypographyLead className="mt-6">
        Discover the powerful tools and capabilities that make Mapped the
        ultimate solution for data management and mapping.
      </TypographyLead>

      {/* Feature Sets */}
      <div className="mt-12 space-y-12">
        {activeFeatureSets.map((featureSet: FeatureSet) => (
          <section key={featureSet._id}>
            <TypographyH2>{featureSet.title}</TypographyH2>
            {featureSet.description && (
              <TypographyP className="mt-2 text-neutral-500 ">
                {featureSet.description}
              </TypographyP>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {featureSet.features && featureSet.features.length > 0 && featureSet.features
                .filter((feature: Feature) => feature.isActive !== false)
                .map((feature: Feature) => (
                  <Link
                    key={feature._id}
                    href={`/docs/${feature.slug.current}`}
                    className="flex flex-col p-4 font-medium gap-2 border hover:bg-neutral-50 transition-all duration-300 border-neutral-200 pb-4 rounded-md"
                  >
                    <p>{feature.title}</p>

                  </Link>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
