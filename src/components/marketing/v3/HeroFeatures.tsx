"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/shadcn/utils";
import {
  HERO_FEATURES,
  SHOWCASE_FEATURES,
  type ShowcaseFeatureId,
} from "./constants";
import type { ReactNode } from "react";

// Mapbox needs the browser; until it loads the dithered map stands in
const HeroMap = dynamic(() => import("./HeroMap"), { ssr: false });

// The hero's left-hand map and the four numbered headlines beside it.
// Hovering (or focusing) a headline fades the dithered map into a live one
// that plays that feature, with its description over the map.
export default function HeroFeatures({
  intro,
  actions,
}: {
  /** Above the headlines, e.g. the tagline */
  intro: ReactNode;
  /** Below the headlines, e.g. the sign-up buttons */
  actions: ReactNode;
}) {
  const [activeId, setActiveId] = useState<ShowcaseFeatureId | null>(null);
  // Keeps the last scene while fading out, so the map doesn't jump back
  const [sceneId, setSceneId] = useState<ShowcaseFeatureId | null>(null);
  const active = SHOWCASE_FEATURES.find((f) => f.id === activeId);

  const show = (id: ShowcaseFeatureId) => {
    setActiveId(id);
    setSceneId(id);
  };

  return (
    <>
      <div className="absolute top-0 left-0 h-full w-[34.514%] overflow-clip bg-[#e8eef0]">
        <HeroMap featureId={sceneId} />
        {/* Keeps the white wordmark legible over the light map */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-[16%] bg-gradient-to-b from-[#15213b]/70 to-transparent transition-opacity duration-500",
            !active && "opacity-0",
          )}
        />
        <Image
          src="/marketing-v3/hero-map.png"
          alt=""
          width={994}
          height={1842}
          priority
          unoptimized
          className={cn(
            "pointer-events-none absolute inset-0 size-full object-cover transition-opacity duration-500",
            active && "opacity-0",
          )}
        />

        {/* The feature's label and description, from the poster bands */}
        <div
          aria-live="polite"
          className={cn(
            "pointer-events-none absolute right-[1.111cqw] bottom-[1.111cqw] left-[1.111cqw] rounded-[0.417cqw] bg-white/95 p-[1.111cqw] shadow-lg transition-[translate,opacity] duration-500",
            active ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
          )}
        >
          {active && (
            <>
              <p className="font-mono text-[0.764cqw] tracking-[0.13em] text-[#15213b]/60 uppercase">
                {active.label}
              </p>
              <p className="mt-[0.417cqw] text-[1.042cqw] leading-[1.35] text-[#15213b]">
                {active.description}
              </p>
            </>
          )}
        </div>
      </div>

      {/* One column, so the intro, headlines and buttons share a left edge
          and never overlap whatever the viewport height; the numbers hang
          in the margin */}
      <div className="absolute top-[12%] bottom-[17%] left-[40.347%] flex w-[47.431%] flex-col justify-center">
        {intro}
        <ol className="mt-[1.389cqw] grid grid-cols-2 gap-x-[3.472cqw] gap-y-[2.083cqw]">
          {HERO_FEATURES.map((feature, index) => (
            <li key={feature.id} className="relative">
              <span className="absolute top-[0.694cqw] right-full mr-[0.556cqw] font-mono text-[0.903cqw] leading-[0.85] font-semibold tracking-[0.08em] text-[#678de3]">
                {index + 1}
              </span>
              <button
                type="button"
                onMouseEnter={() => show(feature.id)}
                onMouseLeave={() => setActiveId(null)}
                onFocus={() => show(feature.id)}
                onBlur={() => setActiveId(null)}
                className="cursor-default text-left text-[4.362cqw] leading-none font-bold tracking-[-0.052em] text-[#15213b] transition-colors outline-none hover:text-[#678de3] focus-visible:underline"
              >
                {feature.title}
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-[3.889cqw]">{actions}</div>
      </div>
    </>
  );
}
