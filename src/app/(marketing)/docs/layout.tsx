import DocsSidebar from "@/app/(marketing)/components/DocsSidebar";
import Container from "@/components/layout/Container";
import { client } from "@/sanity/lib/client";
import type { Feature, FeatureSet } from "@/app/(marketing)/types";

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
  icon,
  order,
  status,
  featureSet->{
    _id,
    title
  }
} | order(order asc)`;

const options = { next: { revalidate: 30 } };

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [featureSets, allFeatures] = await Promise.all([
    client.fetch(FEATURE_SETS_QUERY, {}, options),
    client.fetch(ALL_FEATURES_QUERY, {}, options),
  ]);

  // Group features by their feature set
  const featureSetsWithFeatures = featureSets.map((featureSet: FeatureSet) => ({
    ...featureSet,
    features: allFeatures.filter(
      (feature: Feature) => feature.featureSet?._id === featureSet._id,
    ),
  }));

  return (
    <Container>
      <div className="flex flex-col md:flex-row gap-8 / py-10 md:pt-16 md:pb-[120px]">
        {featureSetsWithFeatures?.length > 0 ? (
          <DocsSidebar featureSets={featureSetsWithFeatures} />
        ) : (
          <></>
        )}

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </Container>
  );
}
