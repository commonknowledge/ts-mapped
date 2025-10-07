import { notFound } from "next/navigation";
import { type SanityDocument } from "next-sanity";
import { client } from "@/sanity/lib/client";
import FeaturePageClient from "./FeaturePageClient";

const FEATURE_QUERY = `*[_type == "feature" && slug.current == $slug][0]{
  _id,
  title,
  subtitle,
  slug,
  explainer,
  icon,
  order,
  status,
  howToUse, 
  featureSet->{
    _id,
    title,
    slug
  }
}`;

const options = { next: { revalidate: 30 } };

export default async function FeaturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const feature = await client.fetch<SanityDocument>(
    FEATURE_QUERY,
    { slug },
    options,
  );

  if (!feature || feature.isActive === false) {
    notFound();
  }

  return <FeaturePageClient feature={feature} />;
}
