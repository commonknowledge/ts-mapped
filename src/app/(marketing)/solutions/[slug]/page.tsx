import Image from "next/image";
import { type SanityDocument } from "next-sanity";
import React from "react";
import Container from "@/components/layout/Container";
import { Link } from "@/components/Link";
import {
  TypographyH1,
  TypographyH2,
  TypographyLead,
  TypographyMuted,
  TypographyP,
} from "@/components/typography";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { Badge } from "@/shadcn/ui/badge";
import { Button } from "@/shadcn/ui/button";
import MuxVideoPlayer from "@/components/marketing/MuxVideoPlayer";

interface Feature {
  _id: string;
  title: string;
  description: string;
  image?: string;
  video?: {
    asset: {
      playbackId: string;
      status: string;
      data: Record<string, unknown>;
    };
  };
  button?: {
    text: string;
    url: string;
    linkType: string;
    docsPage?: {
      slug: {
        current: string;
      };
    };
  };
}

const POST_QUERY = `*[_type == "solutions" && slug.current == $slug][0]{
  title,
  subtitle,
  slug,
  position,
  publishedAt,
  status,
  features[]->{
    _id,
    title,
    description,
    image,
    video{
      asset->{
        playbackId,
        status,
        data
      }
    },
    button{
      text,
      linkType,
      url,
      docsPage->{
        slug
      }
    }
  }
}`;
const options = { next: { revalidate: 30 } };

export default async function SolutionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const solution = await client.fetch<SanityDocument>(
    POST_QUERY,
    await params,
    options,
  );

  if (!solution) {
    return (
      <div className="container mx-auto px-4 py-8">
        <TypographyH1>Solution Not Found</TypographyH1>
        <TypographyP>
          The solution you&apos;re looking for doesn&apos;t exist.
        </TypographyP>
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <div className="bg-brand-background relative overflow-hidden py-10 md:py-20">
        <Container>
          <div className="relative z-10 / flex flex-col gap-6">
            {/* Breadcrumb */}
            <TypographyMuted className="mb-2 font-mono">
              Solutions
            </TypographyMuted>

            <div>
              <TypographyH1>{solution.title}</TypographyH1>
              {solution.subtitle && (
                <TypographyLead className="mt-2 max-w-2xl">
                  {solution.subtitle}
                </TypographyLead>
              )}
              {solution.status === "coming-soon" && (
                <TypographyP className="mt-10 text-neutral-600 text-sm flex items-center gap-2">
                  <Badge>Coming soon</Badge>
                  Bear with, we&apos;re working on it!
                </TypographyP>
              )}
            </div>
          </div>
        </Container>

        <div className="absolute -top-2 -right-2 md:w-auto w-1/2">
          <Image
            src="/pattern.svg"
            alt="Mapped"
            className=""
            height={600}
            width={300}
          />
        </div>
      </div>

      {/* Content */}
      <Container className="py-10 md:py-20">
        {(() => {
          const validFeatures = (solution.features?.filter(
            (f: Feature | null): f is Feature =>
              f !== null && f._id !== undefined,
          ) || []) as Feature[];

          return validFeatures.length > 0 ? (
            validFeatures.map((feature: Feature, index: number) => (
              <FeatureCard
                key={feature._id}
                feature={feature}
                isReversed={index % 2 === 1}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <TypographyH2>No features available</TypographyH2>
              <TypographyP className="mt-2 text-neutral-600">
                This solution doesn&apos;t have any features yet.
              </TypographyP>
            </div>
          );
        })()}
      </Container>
    </>
  );
}

function FeatureCard({
  feature,
  isReversed,
}: {
  feature: Feature;
  isReversed: boolean;
}) {
  const playbackId = feature.video?.asset?.playbackId;

  const textContent = (
    <div className="col-span-1 space-y-4">
      <TypographyH2>{feature.title}</TypographyH2>
      <div className="text-neutral-600">
        {feature.description?.split("\n").map((paragraph, index) => (
          <TypographyP key={index} className="text-base">
            {paragraph}
          </TypographyP>
        ))}
      </div>
      {feature.button &&
        (() => {
          let href: string | null = null;

          if (feature.button.linkType === "docs") {
            if (feature.button.docsPage?.slug?.current) {
              href = `/docs/${feature.button.docsPage.slug.current}`;
            }
          } else {
            href = feature.button.url || null;
          }

          if (!href) return null;

          return (
            <Button className="mt-4" variant="secondary">
              <Link href={href}>{feature.button.text}</Link>
            </Button>
          );
        })()}
    </div>
  );

  const mediaContent = (
    <div className="col-span-2">
      {playbackId ? (
        <div className="w-full rounded-lg overflow-hidden">
          <MuxVideoPlayer
            playbackId={playbackId}
            className="w-full h-full"
            autoplay={true}
            loop={true}
            muted={true}
          />
        </div>
      ) : feature.image ? (
        <Image
          src={urlFor(feature.image).url()}
          alt={feature.title}
          width={1400}
          height={1000}
          className="w-full h-full object-cover rounded-lg"
        />
      ) : (
        <Image
          src={"/screenshot-placeholder.jpeg"}
          alt={feature.title}
          width={1400}
          height={1000}
          className="w-full h-full object-cover rounded-lg"
        />
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12 items-center">
      {/* Mobile: Always media first, then text */}
      <div className="md:hidden">
        {mediaContent}
        {textContent}
      </div>

      {/* Desktop: Respect isReversed logic */}
      <div className="hidden md:contents">
        {isReversed ? (
          <>
            {mediaContent}
            {textContent}
          </>
        ) : (
          <>
            {textContent}
            {mediaContent}
          </>
        )}
      </div>
    </div>
  );
}
