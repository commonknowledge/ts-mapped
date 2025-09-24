import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type SanityDocument } from "next-sanity";
import RichTextComponent from "@/app/(marketing)/components/RichTextComponent";
import { TypographyH1, TypographyLead } from "@/components/typography";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/shadcn/ui/breadcrumb";
import { Separator } from "@/shadcn/ui/separator";

import type { FeatureHowToUseSteps } from "@/app/(marketing)/types";

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

  return (
    <div className="max-w-4xl flex flex-col gap-4">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList className="flex items-center space-x-2 text-sm text-neutral-500">
          <BreadcrumbItem>
            <Link href="/docs" className="hover:text-neutral-700">
              Docs
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{feature.featureSet?.title}</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="text-neutral-900 font-medium">
            {feature.title}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="mt-4">
        <TypographyH1>{feature.title}</TypographyH1>
        {feature.subtitle && (
          <TypographyLead className="mt-4">{feature.subtitle}</TypographyLead>
        )}
      </div>

      {/* Content */}
      <div className=" flex flex-col gap-8 ">
        {feature.explainer && (
          <RichTextComponent
            content={feature.explainer}
            className="max-w-2xl"
          />
        )}
        <Separator className="mt-8" />
        {feature.howToUse && (
          <div className="space-y-4">
            <p className="text-lg font-medium">{feature.howToUse.title}</p>
            {feature.howToUse.steps.map(
              (step: FeatureHowToUseSteps, index: number) => {
                return (
                  <div key={index}>
                    <div className="flex gap-2">
                      <div className="shrink-0 h-6 w-6 bg-brand-background rounded-full text-sm font-mono items-center justify-center flex text-brand-blue">
                        {index + 1}
                      </div>
                      <div className="flex flex-col gap-4">
                        <div className="max-w-2xl">
                          <h3 className="mb-2">{step.title}</h3>
                          <RichTextComponent
                            content={step.description}
                            className="text-sm text-neutral-500"
                          />
                        </div>
                        {step.images && step.images.length > 0 && (
                          <div className="flex gap-2" key={index}>
                            {step.images.map((image, imageIndex) => (
                              <div key={imageIndex}>
                                <Image
                                  src={urlFor(image).url()}
                                  alt={image.alt || image.caption || "Image"}
                                  width={1000}
                                  height={1000}
                                  className="w-full h-full object-cover"
                                />
                                <p className="text-sm text-neutral-500 mt-2">
                                  {image.caption}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}
      </div>
    </div>
  );
}
