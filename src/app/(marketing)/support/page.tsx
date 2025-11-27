import Prose from "@/components/Prose";
import { client } from "@/sanity/lib/client";
import RichTextComponent from "../components/RichTextComponent";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";
import { TypographyH2, TypographyH3, TypographyP } from "@/components/typography";
// import MuxVideoPlayer from "@/components/marketing/MuxVideoPlayer"; // Uncomment when ready to add video

const supportQuery = `*[_type == "support"][0]`;

export default async function SupportPage() {
    const support = await client.fetch(supportQuery);
    if (!support) {
        return notFound();
    }
    return (
        <>
            {support.primaryImage && (
                <div className="relative w-full h-120 flex items-center justify-center">
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
                    <div className="relative z-10 w-full p-10 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-7xl mx-auto">
                        <h2 className="text-white text-8xl font-semibold tracking-tighter text-balance">
                            {support.title}
                        </h2>
                    </div>
                </div>
            )}
            {/* Stats Section */}
            <div className="bg-brand-background py-16 md:py-20">
                <Container>
                    <div className="text-center">
                        <TypographyH2 className="text-4xl md:text-6xl font-semibold tracking-tighter mb-4">
                            99% of projects succeed with your support
                        </TypographyH2>
                        <TypographyP className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto">
                            Your contributions make a real difference in helping communities thrive
                        </TypographyP>
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                            <div className="text-center">
                                <div className="text-5xl md:text-6xl font-semibold tracking-tight mb-2">500+</div>
                                <TypographyP className="text-neutral-600">Active Projects</TypographyP>
                            </div>
                            <div className="text-center">
                                <div className="text-5xl md:text-6xl font-semibold tracking-tight mb-2">10K+</div>
                                <TypographyP className="text-neutral-600">People Supported</TypographyP>
                            </div>
                            <div className="text-center">
                                <div className="text-5xl md:text-6xl font-semibold tracking-tight mb-2">50+</div>
                                <TypographyP className="text-neutral-600">Countries Reached</TypographyP>
                            </div>
                        </div>
                    </div>
                </Container>
            </div>

            {/* Video Section */}
            <div className="py-16 md:py-20">
                <Container>
                    <div className="flex flex-col md:flex-row gap-8 xl:gap-20 items-center">
                        <div className="w-full md:w-1/2">
                            <div className="max-w-[50ch] flex flex-col gap-4 md:gap-6">
                                <TypographyH3 className="text-2xl md:text-4xl font-medium tracking-tight">
                                    See how your support makes a difference
                                </TypographyH3>
                                <TypographyP className="text-lg text-neutral-600">
                                    This community was able to achieve their goals because of your donations,
                                    creating positive change that impacts thousands of lives.
                                </TypographyP>
                            </div>
                        </div>
                        <div className="w-full md:w-1/2 shadow-lg rounded-md overflow-hidden">
                            {/* Dummy video placeholder - replace with actual video playbackId later */}
                            <div className="relative w-full aspect-video bg-neutral-200 flex items-center justify-center">
                                <div className="text-center p-8">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-400 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                        </svg>
                                    </div>
                                    <TypographyP className="text-neutral-500">Video placeholder</TypographyP>
                                    <TypographyP className="text-sm text-neutral-400 mt-2">
                                        Replace with MuxVideoPlayer component
                                    </TypographyP>
                                </div>
                            </div>
                        </div>
                    </div>
                </Container>
            </div>

            {/* 3 Column Grid with Cards */}
            <div className="bg-neutral-50 py-16 md:py-20">
                <Container>
                    <div className="text-center mb-12">
                        <TypographyH2 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">
                            We believe in
                        </TypographyH2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-full bg-brand-blue/10 flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <TypographyH3 className="text-xl font-semibold mb-3">People</TypographyH3>
                            <TypographyP className="text-neutral-600">
                                Start with people. People living in communities do amazing things when backed
                                with support that benefits everyone and helps create lasting change.
                            </TypographyP>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <TypographyH3 className="text-xl font-semibold mb-3">Impact</TypographyH3>
                            <TypographyP className="text-neutral-600">
                                Creating meaningful impact is a powerful way to drive change. All we have to do
                                is support the right initiatives and communities.
                            </TypographyP>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <TypographyH3 className="text-xl font-semibold mb-3">Action</TypographyH3>
                            <TypographyP className="text-neutral-600">
                                Real change starts with action. Supporting communities and initiatives creates
                                positive outcomes, securing a better future for everyone.
                            </TypographyP>
                        </div>
                    </div>
                </Container>
            </div>

            <div className="pt-16 md:pt-20 pb-20 md:pb-[120px]">
                <Prose className="mx-auto">
                    <RichTextComponent content={support.introText} />
                    <RichTextComponent content={support.body} />
                </Prose>
            </div>
        </>
    );
}
