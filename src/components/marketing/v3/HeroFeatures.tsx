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
import MobileSteps from "./MobileSteps";
import type { ReactNode } from "react";

// Mapbox needs the browser; until it loads the dithered map stands in
const HeroMap = dynamic(() => import("./HeroMap"), { ssr: false });

// The hero's left-hand map and the four numbered headlines beside it.
// Hovering (or focusing) a headline fades the dithered map into a live one
// that plays that feature, with its description over the map.
// On small screens the map sits above the headlines in document flow.
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
      {/* Desktop only: on phones the map comes with the steps, below.
          Width follows the panel's design aspect from the stage height, so
          widening the page doesn't stretch the map. */}
      <div className="relative hidden overflow-clip bg-[#e8eef0] lg:absolute lg:inset-y-0 lg:left-0 lg:block lg:aspect-[497/921] lg:h-full lg:w-auto lg:max-w-[34.514%]">
        <HeroMap featureId={sceneId} />
        {/* Scrim for the wordmark: always on mobile, only while a scene plays on lg */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-[22%] bg-gradient-to-b from-[#15213b]/75 to-transparent transition-opacity duration-500 lg:h-[16%]",
            !active && "lg:opacity-0",
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
            "pointer-events-none absolute inset-0 size-full object-cover object-center transition-opacity duration-500",
            active && "opacity-0",
          )}
        />

        {/* The feature's label and description, from the poster bands */}
        <div
          aria-live="polite"
          className={cn(
            "pointer-events-none absolute right-3 bottom-3 left-3 rounded-md bg-white/95 p-3 shadow-lg transition-[translate,opacity] duration-500 lg:right-[1.111cqw] lg:bottom-[1.111cqw] lg:left-[1.111cqw] lg:rounded-[0.417cqw] lg:p-[1.111cqw]",
            active ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
          )}
        >
          {active && (
            <>
              <p className="font-mono text-[10px] tracking-[0.13em] text-[#15213b]/60 uppercase lg:text-[0.764cqw]">
                {active.label}
              </p>
              <p className="mt-1.5 text-sm leading-[1.35] text-[#15213b] lg:mt-[0.417cqw] lg:text-[1.042cqw]">
                {active.description}
              </p>
            </>
          )}
        </div>
      </div>

      {/* One column on desktop so intro, headlines and buttons share a left
          edge; on mobile it follows the map in normal flow */}
      <div className="relative flex w-full flex-col px-5 pt-4 pb-10 lg:absolute lg:top-[12%] lg:bottom-[17%] lg:left-[40.347%] lg:w-[47.431%] lg:justify-center lg:px-0 lg:pt-0 lg:pb-0">
        {intro}
        {/* Clear only when leaving the grid — gaps must not drop the map mid-cross */}
        <ol
          className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6 lg:mt-[1.389cqw] lg:gap-x-[3.472cqw] lg:gap-y-[2.083cqw]"
          onMouseLeave={() => setActiveId(null)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              setActiveId(null);
            }
          }}
        >
          {HERO_FEATURES.map((feature, index) => (
            <li key={feature.id} className="relative pl-7 lg:pl-0">
              <span className="absolute top-1 left-0 font-mono text-xs leading-[0.85] font-semibold tracking-[0.08em] text-[#678de3] lg:top-[0.694cqw] lg:right-full lg:left-auto lg:mr-[0.556cqw] lg:text-[0.903cqw]">
                {index + 1}
              </span>
              <button
                type="button"
                onClick={() => show(feature.id)}
                onMouseEnter={() => show(feature.id)}
                onFocus={() => show(feature.id)}
                className={cn(
                  "cursor-default text-left text-[1.75rem] leading-[1.05] font-bold tracking-[-0.052em] text-[#15213b] transition-colors outline-none hover:text-[#678de3] focus-visible:underline sm:text-[2.25rem] lg:text-[4.362cqw] lg:leading-none",
                  activeId === feature.id && "text-[#678de3]",
                )}
              >
                {feature.title}
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-8 lg:mt-[3.889cqw]">{actions}</div>
      </div>

      {/* Phones: the four steps, told by scrolling past the map */}
      <MobileSteps />
    </>
  );
}
