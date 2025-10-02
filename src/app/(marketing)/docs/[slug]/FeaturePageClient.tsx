"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { type SanityDocument } from "next-sanity";
import RichTextComponent from "@/app/(marketing)/components/RichTextComponent";
import { Link } from "@/components/Link";
import { TypographyH1, TypographyLead } from "@/components/typography";
import { urlFor } from "@/sanity/lib/image";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/shadcn/ui/breadcrumb";
import { Separator } from "@/shadcn/ui/separator";
import { cn } from "@/shadcn/utils";

import type { FeatureHowToUseSteps } from "@/app/(marketing)/types";

export default function FeaturePageClient({
    feature,
}: {
    feature: SanityDocument;
}) {
    const [activeSection, setActiveSection] = useState(0);
    const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

    const scrollToSection = (index: number) => {
        sectionRefs.current[index]?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
        setActiveSection(index);
    };

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 100;

            sectionRefs.current.forEach((ref, index) => {
                if (ref) {
                    const { offsetTop, offsetHeight } = ref;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(index);
                    }
                }
            });
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="flex gap-8">
            {/* Main Content */}
            <div className="flex-1 max-w-4xl flex flex-col gap-4">
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
                <div className="flex flex-col gap-8">
                    {feature.explainer && (
                        <RichTextComponent
                            content={feature.explainer}
                            className="max-w-2xl"
                        />
                    )}
                    {feature.howToUse && feature.howToUse.length > 0 && (
                        <div className="space-y-24">
                            {feature.howToUse.map((section: any, sectionIndex: number) => (
                                <div
                                    key={sectionIndex}
                                    ref={(el) => {
                                        sectionRefs.current[sectionIndex] = el;
                                    }}
                                    className="space-y-4"
                                >
                                    <Separator className="mt-8" />
                                    {section.title && (
                                        <p className="text-lg font-medium">{section.title}</p>
                                    )}
                                    {section.steps.map(
                                        (step: FeatureHowToUseSteps, stepIndex: number) => {
                                            return (
                                                <div key={stepIndex} className="flex gap-2 mb-10">
                                                    <div className="shrink-0 h-6 w-6 bg-brand-background rounded-full text-sm font-mono items-center justify-center flex text-brand-blue">
                                                        {stepIndex + 1}
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
                                                            <div className="flex flex-col gap-8" key={stepIndex}>
                                                                {step.images.map((image, imageIndex) => (
                                                                    <div key={imageIndex}>
                                                                        <Image
                                                                            src={urlFor(image).url()}
                                                                            alt={image.alt || image.caption || "Image"}
                                                                            width={1000}
                                                                            height={1000}
                                                                            className="w-full h-full border rounded-md border-neutral-200 shadow-md"
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
                                            );
                                        },
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Mini Navigation - Only show if more than one section */}
            {feature.howToUse && feature.howToUse.length > 1 && (
                <div className="hidden lg:block w-64 flex-shrink-0">
                    <div className="sticky top-24">
                        <div className="p-4">
                            <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                                Contents
                            </h3>
                            <nav className="space-y-2">
                                {feature.howToUse.map((section: any, index: number) => (
                                    <button
                                        key={index}
                                        onClick={() => scrollToSection(index)}
                                        className={cn(
                                            "block w-full text-left text-sm rounded-md transition-colors",
                                            activeSection === index
                                                ? "text-neutral-800 underline"
                                                : "text-neutral-500 hover:text-neutral-900"
                                        )}
                                    >
                                        {section.title || `Section ${index + 1}`}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
