import { client } from "@/sanity/lib/client";

export const FEATURE_SETS_QUERY = `*[_type == "featureSet"] | order(order asc) {
  _id,
  title,
  subtitle,
  slug,
  description,
  icon,
  order
}`;

export const ALL_FEATURES_QUERY = `*[_type == "feature" && status == "active"] {
  _id,
  title,
  subtitle,
  slug,
  description,
  explainer,
  icon,
  order,
  status,
  isActive,
  featureSet->{
    _id,
    title
  }
} | order(order asc)`;

const options = { next: { revalidate: 30 } };

export async function fetchFeatureSetsAndFeatures() {
  const [featureSets, allFeatures] = await Promise.all([
    client.fetch(FEATURE_SETS_QUERY, {}, options),
    client.fetch(ALL_FEATURES_QUERY, {}, options),
  ]);

  // Group features by their feature set
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const featureSetsWithFeatures = featureSets.map((featureSet: any) => ({
    ...featureSet,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    features: allFeatures.filter((feature: any) => feature.featureSet?._id === featureSet._id),
  }));

  return {
    featureSets,
    allFeatures,
    featureSetsWithFeatures,
  };
}
