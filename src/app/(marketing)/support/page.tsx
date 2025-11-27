import Prose from "@/components/Prose";
import { client } from "@/sanity/lib/client";
import RichTextComponent from "../components/RichTextComponent";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";
import { TypographyH2, TypographyH3, TypographyP } from "@/components/typography";
import MuxVideoPlayer from "@/components/marketing/MuxVideoPlayer";
import OpenCollectiveEmbed from "./OpenCollectiveEmbed";
import CTAModalButton from "./CTAModalButton";

const supportQuery = `*[_type == "support" && active == true][0]{
    title,
    openCollectiveProjectSlug,
    introText,
    body,
    primaryImage,
    imageBreak,
    introSections[],
    statsSections[],
    videoSections[],
    featuresSection[],
    whySupportSections[],
    whatSupportersGetSections[],
    whoThisIsForSections[],
    ctaSections[]
}`;

// Type definitions for Sanity sections
interface IntroSection {
    active?: boolean;
    headline: string;
    body?: any; // blockContent
}

interface StatsSection {
    active?: boolean;
    title: string;
    description?: string;
    image?: any;
    stats?: Array<{
        value: string;
        label: string;
    }>;
}

interface VideoSection {
    active?: boolean;
    title: string;
    description?: string;
    videoPlaybackId?: string;
}

interface FeatureCard {
    title: string;
    description: string;
    iconType?: "people" | "impact" | "action";
    iconBgColor?: string;
    iconTextColor?: string;
}

interface FeaturesSection {
    active?: boolean;
    title: string;
    cards?: FeatureCard[];
}

interface WhySupportSection {
    active?: boolean;
    title: string;
    description?: string;
}

interface Benefit {
    title: string;
    description: string;
}

interface WhatSupportersGetSection {
    active?: boolean;
    title: string;
    description?: string;
    benefits?: Benefit[];
}

interface WhoThisIsForSection {
    active?: boolean;
    title: string;
    description?: string;
    audiences?: string[];
}

interface CTASection {
    active?: boolean;
    title: string;
    description?: string;
    subDescription?: string;
    buttonText: string;
}

// Helper function to find active section from array
function findActiveSection<T extends { active?: boolean }>(sections: T[] | undefined): T | null {
    if (!sections || sections.length === 0) return null;
    return sections.find((section) => section.active === true) || null;
}


// Helper function to render icon based on type
function renderIcon(iconType: "people" | "impact" | "action", colorClass: string) {
    switch (iconType) {
        case "people":
            return (
                <svg className={`w-6 h-6 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                </svg>
            );
        case "impact":
            return (
                <svg className={`w-6 h-6 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            );
        case "action":
            return (
                <svg className={`w-6 h-6 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            );
        default:
            return null;
    }
}

export default async function SupportPage() {
    const support = await client.fetch(supportQuery);
    if (!support) {
        return notFound();
    }

    // Find active sections
    const introSection = findActiveSection<IntroSection>(support.introSections);
    const statsSection = findActiveSection<StatsSection>(support.statsSections);
    const videoSection = findActiveSection<VideoSection>(support.videoSections);
    const featuresSection = findActiveSection<FeaturesSection>(support.featuresSection);
    const whySupportSection = findActiveSection<WhySupportSection>(support.whySupportSections);
    const whatSupportersGetSection = findActiveSection<WhatSupportersGetSection>(support.whatSupportersGetSections);
    const whoThisIsForSection = findActiveSection<WhoThisIsForSection>(support.whoThisIsForSections);
    const ctaSection = findActiveSection<CTASection>(support.ctaSections);

    return (
        <>
            {support.primaryImage && (
                <div className="relative w-full min-h-[400px] md:min-h-[500px] lg:min-h-[600px] flex items-center justify-center">
                    <div className="absolute inset-0 w-full h-full z-0">
                        <Image
                            src={urlFor(support.primaryImage).url()}
                            alt={support.title}
                            width={1000}
                            height={1200}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 w-full h-full bg-black/30" />
                    </div>
                    <div className="relative z-10 w-full px-4 py-8 md:px-10 md:py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 max-w-7xl mx-auto">
                        <div className="flex items-center justify-center lg:justify-start">
                            <h2 className="text-white text-4xl md:text-6xl lg:text-8xl  font-semibold tracking-tighter text-balance">
                                {support.title}
                            </h2>
                        </div>
                        {/* open collective embed */}
                        <div className="w-full flex items-center justify-center">
                            <OpenCollectiveEmbed variant="custom" collectiveSlug={support.openCollectiveProjectSlug || ""} />
                        </div>
                    </div>
                </div>
            )}
            {/* Intro Section */}
            {introSection && (
                <div className="pt-16 md:pt-20 pb-12 md:pb-16">
                    <Container>
                        <div className="max-w-3xl mx-auto">
                            <TypographyH2 className="text-3xl md:text-5xl font-medium tracking-tight mb-6 text-balance">
                                {introSection.headline}
                            </TypographyH2>
                            {introSection.body && (
                                <div className="text-lg text-neutral-700">
                                    <RichTextComponent content={introSection.body} />
                                </div>
                            )}
                        </div>
                    </Container>
                </div>
            )}
            {/* Stats Section */}
            {statsSection && (
                <div className="bg-brand-background">
                    <Container>
                        <div className={`flex flex-col ${statsSection.image ? "lg:flex-row" : ""} items-center gap-8 md:gap-12 py-16 md:py-20`}>
                            {/* Image - on the side for larger screens */}
                            {statsSection.image && (
                                <div className="w-full md:w-1/2 lg:w-2/5 flex-shrink-0">
                                    <div className="aspect-square w-full max-w-md mx-auto md:max-w-none">
                                        <Image
                                            src={urlFor(statsSection.image).url()}
                                            alt={statsSection.title}
                                            width={1000}
                                            height={1000}
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 w-full text-center">
                                <TypographyH2 className="text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tighter mb-4">
                                    {statsSection.title}
                                </TypographyH2>
                                {statsSection.description && (
                                    <TypographyP className="text-base md:text-lg lg:text-xl text-neutral-600 max-w-2xl mx-auto">
                                        {statsSection.description}
                                    </TypographyP>
                                )}
                                {statsSection.stats && statsSection.stats.length > 0 && (
                                    <div className={`mt-8 md:mt-12 flex flex-col ${statsSection.stats.length === 3 ? "md:grid md:grid-cols-3" : statsSection.stats.length === 2 ? "md:grid md:grid-cols-2" : ""} gap-6 md:gap-8 max-w-4xl mx-auto`}>
                                        {statsSection.stats.map((stat, index) => (
                                            <div key={index} className="text-center">
                                                <div className="text-4xl lg:text-5xl font-semibold tracking-tight mb-2">
                                                    {stat.value}
                                                </div>
                                                <TypographyP className="text-neutral-600">{stat.label}</TypographyP>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Container>
                </div>
            )}

            {/* Video Section */}
            {videoSection && (
                <div className="py-16 md:py-20">
                    <Container>
                        <div className="flex flex-col md:flex-row gap-8 xl:gap-20 items-center">
                            <div className="w-full md:w-1/2">
                                <div className="max-w-[50ch] flex flex-col gap-4 md:gap-6">
                                    <TypographyH3 className="text-2xl md:text-4xl font-medium tracking-tight">
                                        {videoSection.title}
                                    </TypographyH3>
                                    {videoSection.description && (
                                        <TypographyP className="text-lg text-neutral-600">{videoSection.description}</TypographyP>
                                    )}
                                </div>
                            </div>
                            <div className="w-full md:w-1/2 shadow-lg rounded-md overflow-hidden">
                                {videoSection.videoPlaybackId ? (
                                    <MuxVideoPlayer playbackId={videoSection.videoPlaybackId} />
                                ) : (
                                    <div className="relative w-full aspect-video bg-neutral-200 flex items-center justify-center">
                                        <div className="text-center p-8">
                                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-400 flex items-center justify-center">
                                                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                                </svg>
                                            </div>
                                            <TypographyP className="text-neutral-500">Video placeholder</TypographyP>
                                            <TypographyP className="text-sm text-neutral-400 mt-2">
                                                Add videoPlaybackId to enable video
                                            </TypographyP>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Container>
                </div>
            )}

            {/* Features Section */}
            {featuresSection && (
                <div className="bg-neutral-50 py-16 md:py-20">
                    <Container>
                        <div className="text-center mb-12">
                            <TypographyH2 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">
                                {featuresSection.title}
                            </TypographyH2>
                        </div>
                        {featuresSection.cards && featuresSection.cards.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {featuresSection.cards.map((card, index) => (
                                    <div key={index} className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
                                        <div
                                            className={`w-12 h-12 rounded-full ${card.iconBgColor || "bg-brand-blue/10"} flex items-center justify-center mb-6`}
                                        >
                                            {renderIcon(
                                                (card.iconType as "people" | "impact" | "action") || "impact",
                                                card.iconTextColor || "text-brand-blue",
                                            )}
                                        </div>
                                        <TypographyH3 className="text-xl font-semibold mb-3">{card.title}</TypographyH3>
                                        <TypographyP className="text-neutral-600">{card.description}</TypographyP>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="text-center mt-8">
                            <TypographyP className="text-lg font-medium text-neutral-800 italic">
                                This is not "nice to have" — it's movement-critical infrastructure.
                            </TypographyP>
                        </div>
                    </Container>
                </div>
            )}

            {/* Why Support Section */}
            {whySupportSection && (
                <div className="py-16 md:py-20">
                    <Container>
                        <div className="max-w-3xl mx-auto">
                            <TypographyH2 className="text-3xl md:text-4xl font-medium tracking-tight mb-6">
                                {whySupportSection.title}
                            </TypographyH2>
                            {whySupportSection.description && (
                                <TypographyP className="text-lg text-neutral-700">{whySupportSection.description}</TypographyP>
                            )}
                        </div>
                    </Container>
                </div>
            )}

            {/* Image Break */}
            {support.imageBreak && (
                <div className="w-full object-cover h-96">
                    <Image src={urlFor(support.imageBreak).url()} alt={support.title} width={1000} height={1000} className="w-full h-full object-cover" />
                </div>
            )}

            {/* What Supporters Get Section */}
            {whatSupportersGetSection && (
                <div className="bg-neutral-50 py-16 md:py-20">
                    <Container>
                        <div className="text-center mb-12">
                            <TypographyH2 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">
                                {whatSupportersGetSection.title}
                            </TypographyH2>
                            {whatSupportersGetSection.description && (
                                <TypographyP className="text-lg text-neutral-700 max-w-3xl mx-auto">
                                    {whatSupportersGetSection.description}
                                </TypographyP>
                            )}
                        </div>
                        {whatSupportersGetSection.benefits && whatSupportersGetSection.benefits.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {whatSupportersGetSection.benefits.map((benefit, index) => (
                                    <div key={index} className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
                                        <TypographyH3 className="text-xl font-semibold mb-3">{benefit.title}</TypographyH3>
                                        <TypographyP className="text-neutral-600">{benefit.description}</TypographyP>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Container>
                </div>
            )}

            {/* Who This Is For Section */}
            {whoThisIsForSection && (
                <div className="py-16 md:py-20">
                    <Container>
                        <div className="max-w-3xl mx-auto">
                            <TypographyH2 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">
                                {whoThisIsForSection.title}
                            </TypographyH2>
                            {whoThisIsForSection.description && (
                                <TypographyP className="text-lg text-neutral-700 mb-6">{whoThisIsForSection.description}</TypographyP>
                            )}
                            {whoThisIsForSection.audiences && whoThisIsForSection.audiences.length > 0 && (
                                <ul className="space-y-3">
                                    {whoThisIsForSection.audiences.map((audience, index) => (
                                        <li key={index} className="flex items-start">
                                            <span className="mr-3 mt-1 text-brand-blue">•</span>
                                            <TypographyP className="text-neutral-700">{audience}</TypographyP>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </Container>
                </div>
            )}

            {/* CTA Section */}
            {ctaSection && (
                <div className="bg-brand-background py-16 md:py-20">
                    <Container>
                        <div className="max-w-3xl mx-auto text-center">
                            <TypographyH2 className="text-3xl md:text-5xl font-medium tracking-tight mb-4">
                                {ctaSection.title}
                            </TypographyH2>
                            {ctaSection.description && (
                                <TypographyP className="text-lg md:text-xl text-neutral-700 mb-6">
                                    {ctaSection.description}
                                </TypographyP>
                            )}
                            {ctaSection.subDescription && (
                                <TypographyP className="text-lg text-neutral-600 mb-8">
                                    {ctaSection.subDescription}
                                </TypographyP>
                            )}
                            {support.openCollectiveProjectSlug && (
                                <CTAModalButton
                                    collectiveSlug={support.openCollectiveProjectSlug}
                                    buttonText={ctaSection.buttonText}
                                />
                            )}
                        </div>
                    </Container>
                </div>
            )}


        </>
    );
}
