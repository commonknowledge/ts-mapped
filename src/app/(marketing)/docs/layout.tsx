import DocsSidebar from "@/app/(marketing)/components/DocsSidebar";
import Container from "@/components/layout/Container";
import { fetchFeatureSetsAndFeatures } from "@/sanity/queries/features";
import { FeaturesProvider } from "./FeaturesContext";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { featureSetsWithFeatures } = await fetchFeatureSetsAndFeatures();

  return (
    <FeaturesProvider featureSetsWithFeatures={featureSetsWithFeatures}>
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
    </FeaturesProvider>
  );
}
