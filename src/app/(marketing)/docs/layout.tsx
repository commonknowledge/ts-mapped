import DocsSidebar from "@/app/(marketing)/components/DocsSidebar";
import Container from "@/components/layout/Container";
import type { FeatureSet } from "@/app/(marketing)/types";
import { manifest } from "../../../../docs-content/manifest";
import { FeaturesProvider } from "./FeaturesContext";

function buildFeatureSets(): FeatureSet[] {
  return manifest
    .sort((a, b) => a.order - b.order)
    .map((set) => ({
      slug: set.slug,
      title: set.title,
      description: set.description,
      order: set.order,
      features: set.features.map((f) => ({
        slug: f.slug,
        title: f.title,
        subtitle: f.subtitle,
        featureSetSlug: set.slug,
      })),
    }));
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const featureSetsWithFeatures = buildFeatureSets();

  return (
    <FeaturesProvider featureSetsWithFeatures={featureSetsWithFeatures}>
      <Container>
        <div className="flex flex-col md:flex-row gap-8 / py-10 md:pt-16 md:pb-[120px]">
          {featureSetsWithFeatures.length > 0 ? (
            <DocsSidebar featureSets={featureSetsWithFeatures} />
          ) : (
            <></>
          )}

          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </Container>
    </FeaturesProvider>
  );
}
