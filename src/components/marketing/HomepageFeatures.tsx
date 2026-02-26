import Image from "next/image";
import React from "react";
import Container from "@/components/layout/Container";
import { Link } from "@/components/Link";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { Button } from "@/shadcn/ui/button";
import MuxVideoPlayer from "@/components/marketing/MuxVideoPlayer";
import {
  TypographyH2,
  TypographyH3,
  TypographyP,
} from "@/components/typography";

const HOMEPAGE_FEATURES_QUERY = `*[_type == "features" && showOnHomepage == true] | order(homepageOrder asc, _createdAt asc) {
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
  },
  solution->{
    _id,
    title,
    slug
  }
}`;

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
  solution?: {
    _id: string;
    title: string;
    slug: { current: string };
  };
}

const options = { next: { revalidate: 30 } };

export default async function HomepageFeatures() {
  const features = await client.fetch<Feature[]>(
    HOMEPAGE_FEATURES_QUERY,
    {},
    options,
  );

  if (!features || features.length === 0) {
    return null;
  }

  return (
    <Container>
      <div className="py-10 md:py-20">
        <div className="mb-12 text-center">
          <TypographyH3>Explore Our Features</TypographyH3>

        </div>
        <div className="flex flex-col gap-10 md:gap-50">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature._id}
              feature={feature}
              alternate={index % 2 === 1}
            />
          ))}
        </div>
      </div>
    </Container>
  );
}

function FeatureCard({
  feature,
  alternate,
}: {
  feature: Feature;
  alternate?: boolean;
}) {
  let href: string | null = null;

  if (feature.button) {
    if (feature.button.linkType === "docs") {
      if (feature.button.docsPage?.slug?.current) {
        href = `/docs/${feature.button.docsPage.slug.current}`;
      }
    } else {
      href = feature.button.url || null;
    }
  } else if (feature.solution) {
    href = `/solutions/${feature.solution.slug?.current || feature.solution._id}`;
  }

  const playbackId = feature.video?.asset?.playbackId;

  return (
    <div
      className={`flex flex-col md:flex-row gap-8 xl:gap-20 ${alternate ? "md:flex-row-reverse" : ""
        }`}
    >
      <div className="w-full md:w-1/2 my-auto">
        <div className="max-w-[50ch] flex flex-col gap-4 md:gap-6 / text-base md:text-lg text-balance ">
          <h3 className="text-2xl md:text-4xl font-medium tracking-tight">
            {feature.title}
          </h3>

          <p className="text-lg max-w-[60ch]">
            {feature.description}
          </p>

          {href && (feature.button || feature.solution) && (
            <Button variant="secondary" size="sm" asChild className="mt-2">
              <Link href={href}>
                {feature.button?.text || "Learn more"}
              </Link>
            </Button>
          )}
        </div>
      </div>
      <div className="w-full md:w-1/2 shadow-lg rounded-md overflow-hidden">
        {playbackId ? (
          <MuxVideoPlayer
            playbackId={playbackId}
            className="w-full h-auto block"
            autoplay={true}
            loop={true}
            muted={true}
          />
        ) : feature.image ? (
          <Image
            src={urlFor(feature.image).url()}
            alt={feature.title}
            className="w-full h-full object-cover"
            width={800}
            height={600}
          />
        ) : (
          <div className="relative w-full aspect-video overflow-hidden rounded-lg bg-gray-200 flex items-center justify-center">
            <p className="text-gray-500">No media available</p>
          </div>
        )}
      </div>
    </div>
  );
}

