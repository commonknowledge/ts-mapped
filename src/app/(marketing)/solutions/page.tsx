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
import { Separator } from "@/shadcn/ui/separator";
import MuxVideoPlayer from "@/components/marketing/MuxVideoPlayer";
import SolutionsTableOfContents from "./components/SolutionsTableOfContents";

const SOLUTIONS_QUERY = `*[_type == "solutions"] | order(position asc){
  _id,
  title,
  subtitle,
  slug,
  position,
  status,
  icon,
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
  } | order(_createdAt asc)
}`;

const options = { next: { revalidate: 30 } };

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

interface Solution {
    _id: string;
    title: string;
    subtitle: string;
    slug: { current: string };
    position: number;
    status: "active" | "archived" | "coming-soon";
    icon: string;
    features?: (Feature | null)[];
}

export default async function SolutionsPage() {
    const solutions = await client.fetch<Solution[]>(
        SOLUTIONS_QUERY,
        {},
        options,
    );

    // Debug: Log solutions to see what we're getting
    // Uncomment to debug:
    // console.log("Solutions data:", JSON.stringify(solutions, null, 2));

    // Generate slug-friendly IDs for anchor links
    const getSolutionId = (slug: string) => {
        return slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    };

    return (
        <>
            {/* Hero */}
            <div className="bg-brand-background relative overflow-hidden py-10 md:py-20">
                <Container>
                    <div className="relative z-10 / flex flex-col gap-6">
                        <TypographyH1>Solutions</TypographyH1>
                        <TypographyLead className="max-w-2xl">
                            Explore our solutions designed to enhance your organising strategy
                            with visual mapping tools.
                        </TypographyLead>
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

            {/* Table of Contents */}
            {solutions.length > 0 && (
                <SolutionsTableOfContents solutions={solutions} />
            )}

            {/* Solutions Content */}
            <Container className="py-10 md:py-20">
                {solutions.length > 0 ? (
                    <div className="space-y-12">
                        {solutions.map((solution) => {
                            const solutionId = getSolutionId(
                                solution.slug?.current || solution.title,
                            );
                            return (
                                <div
                                    key={solution._id}
                                    id={solutionId}
                                    className="scroll-mt-32 md:scroll-mt-40 border border-neutral-200 rounded-lg p-8 md:p-12"
                                >
                                    {/* Solution Header */}
                                    <div className="mb-8 md:mb-12">
                                        <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                                            <Image
                                                src={urlFor(solution.icon).url()}
                                                alt={solution.title}
                                                className="w-6 h-6 md:w-8 md:h-8 opacity-50 flex-shrink-0"
                                                width={32}
                                                height={32}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                                    <TypographyH1 className="text-2xl sm:text-3xl break-words">
                                                        {solution.title}
                                                    </TypographyH1>
                                                    {solution.status === "coming-soon" && (
                                                        <Badge variant="secondary" className="self-start sm:self-center">
                                                            Coming soon
                                                        </Badge>
                                                    )}
                                                </div>
                                                {solution.subtitle && (
                                                    <TypographyLead className="max-w-2xl text-base sm:text-lg md:text-xl">
                                                        {solution.subtitle}
                                                    </TypographyLead>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Solution Content */}
                                    {(() => {
                                        const validFeatures = (solution.features?.filter(
                                            (f: Feature | null): f is Feature => f !== null && f._id !== undefined
                                        ) || []) as Feature[];

                                        return validFeatures.length > 0 ? (
                                            <div className="space-y-12">
                                                {validFeatures.map(
                                                    (feature: Feature, index: number) => (
                                                        <FeatureCard
                                                            key={feature._id}
                                                            feature={feature}
                                                            isReversed={index % 2 === 1}
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <TypographyP className="text-neutral-600">
                                                    This solution doesn&apos;t have any features yet.
                                                </TypographyP>
                                            </div>
                                        );
                                    })()}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <TypographyH2>No solutions available</TypographyH2>
                        <TypographyP className="mt-2 text-neutral-600">
                            Solutions will appear here once they&apos;re added.
                        </TypographyP>
                    </div>
                )}
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
            {feature.button && (() => {
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
                        <Link href={href}>
                            {feature.button.text}
                        </Link>
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

