"use client";
import Image from "next/image";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";

interface Feature {
  title: string;
  description: string;
  image?: string;
  timeline?: string;
}

export default function FeaturesPage() {
  const features: Feature[] = [
    {
      title: "See my members on a map",
      description:
        "Get a geographic overview of your members, locations or areas of interest.",
      timeline: "Q2 2025",
      image: "/features/feat-mapping.png",
    },
    {
      title: "Import my member data from other tools",
      description:
        "Sync your data with other tools and services, including Google Sheets, Google Maps, and more.",
      timeline: "Q2 2025",
      image: "/features/feat-data-sources.png",
    },
    {
      title: "Geographic Member Segmentation",
      description:
        "Segment your members using by proximity to a location or within a defined area. Combine with your own data to create targeted campaigns.",
      timeline: "Q3 2025",
      image: "/features/feat-member-segmentation.png",
    },
    {
      title: "Public Maps",
      description:
        "Create public maps of your data to share with your members and the public.",
      timeline: "Q3 2025",
    },
    {
      title: "The Movement Data Library",
      description:
        "A library of useful data sets relevant to movement organising, provided by a range of organisations as well as Mapped users themselves.",
      timeline: "Q4 2025",
      image: "/features/feat-data-lib.png",
    },
  ];

  // Helper function to parse timeline and compare with current quarter
  const parseTimeline = (timeline: string) => {
    const match = timeline.match(/Q(\d)\s+(\d{4})/);
    if (!match) return { quarter: 0, year: 0 };
    return { quarter: parseInt(match[1]), year: parseInt(match[2]) };
  };

  const compareTimeline = (timeline1: string, timeline2: string) => {
    const t1 = parseTimeline(timeline1);
    const t2 = parseTimeline(timeline2);

    if (t1.year !== t2.year) return t1.year - t2.year;
    return t1.quarter - t2.quarter;
  };

  // Current quarter (you can update this as needed)
  const currentQuarter = "Q3 2025";

  // Categorize features
  const activeFeatures = features.filter(
    (feature) =>
      feature.timeline && compareTimeline(feature.timeline, currentQuarter) < 0,
  );

  const currentlyWorkingOn = features.filter(
    (feature) =>
      feature.timeline &&
      compareTimeline(feature.timeline, currentQuarter) === 0,
  );

  const roadmapFeatures = features.filter(
    (feature) =>
      feature.timeline && compareTimeline(feature.timeline, currentQuarter) > 0,
  );

  const renderFeatureCard = (feature: Feature) => (
    <div key={feature.title} className="relative">
      {/* Content */}
      <div className="ml-12 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-medium ">{feature.title}</h3>
            </div>
            <p className="text-neutral-600 leading-relaxed mb-3">
              {feature.description}
            </p>
            {feature.timeline && (
              <p className="text-sm text-neutral-500">
                Timeline: {feature.timeline}
              </p>
            )}
          </div>
          {feature.image && (
            <div className="">
              <Dialog>
                <DialogTrigger asChild>
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    width={1400}
                    height={1000}
                    className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  />
                </DialogTrigger>
                <DialogContent className="h-[90vh] max-w-none! w-[90vw] p-0 border-none shadow-none bg-transparent">
                  <DialogTitle className="sr-only">
                    {feature.title} - Feature Preview
                  </DialogTitle>
                  <Image
                    src={feature.image}
                    alt={`${feature.title} preview`}
                    width={3000}
                    height={2000}
                    className="max-h-[90vh] w-full object-contain"
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const stageColors = {
    active: "bg-brand-blue",
    working: "bg-[#B3C6F1]",
    roadmap: "bg-neutral-200",
  };

  return (
    <div className="py-[160px]">
      <div className="container">
        <div className="mb-16">
          <h1 className="text-4xl font-medium  mb-4 tracking-tight">
            Features
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl ">
            Discover what&apos;s available now and what&apos;s coming soon to
            help you map and understand your data geographically.
          </p>
        </div>

        <div className="relative">
          {/* Main timeline line */}
          <div className="absolute left-[1.05rem] top-4 bottom-0 w-0.5 bg-gradient-to-b from-brand-blue via-[#B3C6F1] to-neutral-50" />

          <div className="grid grid-cols-1 gap-8">
            {/* Active Features */}
            <div className="space-y-6">
              <div className="relative">
                <div
                  className={`absolute left-3 w-3 h-3 rounded-full  shadow-lg z-10 -tranneutral-x-1/2 ${stageColors.active}`}
                  style={{ top: "0.5rem" }}
                />
                <div className="ml-12 ">
                  <h2 className="text-neutral-600 font-mono  mb-1">
                    Active Features
                  </h2>
                  <p className="text-neutral-600 text-sm">
                    Released and available now
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {activeFeatures.length > 0 ? (
                  activeFeatures.map((feature) => renderFeatureCard(feature))
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <p>No active features yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Currently Working On */}
            <div className="space-y-6">
              <div className="relative">
                <div
                  className={`absolute left-3 w-3 h-3 rounded-full  shadow-lg z-10 -tranneutral-x-1/2 ${stageColors.working}`}
                  style={{ top: "0.5rem" }}
                />
                <div className="ml-12 ">
                  <h2 className="text-neutral-600 font-mono  mb-1">
                    Currently Working On
                  </h2>
                  <p className="text-neutral-600 text-sm">
                    In development for {currentQuarter}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {currentlyWorkingOn.length > 0 ? (
                  currentlyWorkingOn.map((feature) =>
                    renderFeatureCard(feature),
                  )
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <p>No features in current quarter</p>
                  </div>
                )}
              </div>
            </div>

            {/* Roadmap */}
            <div className="space-y-6">
              <div className="relative">
                <div
                  className={`absolute left-3 w-3 h-3 rounded-full  shadow-lg z-10 -tranneutral-x-1/2 ${stageColors.roadmap}`}
                  style={{ top: "0.5rem" }}
                />
                <div className="ml-12 ">
                  <h2 className="text-neutral-600 font-mono  mb-1">Roadmap</h2>
                  <p className="text-neutral-600 text-sm">
                    Planned for future quarters
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {roadmapFeatures.length > 0 ? (
                  roadmapFeatures.map((feature) => renderFeatureCard(feature))
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <p>No roadmap features yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
