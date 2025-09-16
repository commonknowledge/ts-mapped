import Link from "next/link";
import React from "react";
import DocsSidebar from "@/app/docs/DocsSidebar";
import {
  TypographyH1,
  TypographyH2,
  TypographyLead,
  TypographyMuted,
  TypographyP,
} from "@/components/typography";
import { client } from "@/sanity/lib/client";
import { Feature, FeatureSet } from "./types";

const FEATURE_SETS_QUERY = `*[_type == "featureSet"] | order(order asc) {
  _id,
  title,
  subtitle,
  slug,
  description,
  icon,
  order
}`;

const ALL_FEATURES_QUERY = `*[_type == "feature"] {
  _id,
  title,
  subtitle,
  slug,
  description,
  icon,
  order,
  isActive,
  featureSet->{
    _id,
    title
  }
} | order(order asc)`;

const options = { next: { revalidate: 30 } };

export default async function FeaturesPage() {
  const [featureSets, allFeatures] = await Promise.all([
    client.fetch(FEATURE_SETS_QUERY, {}, options),
    client.fetch(ALL_FEATURES_QUERY, {}, options),
  ]);

  // Group features by their feature set
  const featureSetsWithFeatures = featureSets.map((featureSet: FeatureSet) => ({
    ...featureSet,
    features: allFeatures.filter(
      (feature: Feature) => feature.featureSet?._id === featureSet._id
    ),
  }));

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <DocsSidebar featureSets={featureSetsWithFeatures} />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="max-w-4xl">
              {/* Header */}
              <TypographyMuted className="mb-4">— Docs</TypographyMuted>

              <TypographyH1>Mapped Documentation</TypographyH1>

              <TypographyLead className="mt-6">
                Discover the powerful tools and capabilities that make Mapped
                the ultimate solution for data management and mapping.
              </TypographyLead>

              {/* Feature Sets */}
              <div className="mt-12 space-y-12">
                {featureSetsWithFeatures.map((featureSet: FeatureSet) => (
                  <section key={featureSet._id}>
                    <TypographyH2>{featureSet.title}</TypographyH2>
                    {featureSet.description && (
                      <TypographyP className="mt-2">
                        {featureSet.description}
                      </TypographyP>
                    )}

                    {featureSet.features && featureSet.features.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {featureSet.features
                          .filter(
                            (feature: Feature) => feature.isActive !== false
                          )
                          .map((feature: Feature) => (
                            <Link
                              key={feature._id}
                              href={`/docs/${feature.slug.current}`}
                              className="flex flex-col p-4 font-medium gap-2 border hover:bg-neutral-50 transition-all duration-300 border-neutral-200 pb-4 rounded-md"
                            >
                              <p>{feature.title}</p>
                              {feature.description && (
                                <p className="mt-1 text-neutral-600">
                                  {feature.description}
                                </p>
                              )}
                            </Link>
                          ))}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
