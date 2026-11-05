"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/shadcn/utils";
import {
  HERO_FEATURES,
  MOBILE_STEP_LINE,
  SHOWCASE_FEATURES,
} from "./constants";

// Mapbox needs the browser; until it loads the dithered map stands in
const HeroMap = dynamic(() => import("./HeroMap"), { ssr: false });

const STEPS = HERO_FEATURES.map((step) => ({
  ...step,
  detail: SHOWCASE_FEATURES.find((feature) => feature.id === step.id),
}));

/**
 * The four steps for phones, told by scrolling: the map stays pinned at the
 * top and plays each step's scene as its card scrolls up to meet it, then
 * slides away under the map
 */
export default function MobileSteps() {
  const [activeIndex, setActiveIndex] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    // The current step is the last whose top has passed just below the map,
    // worked out from the scroll position so jumps (a restored scroll, a
    // link) land on the right one
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * MOBILE_STEP_LINE;
      let index = 0;
      stepRefs.current.forEach((step, i) => {
        if (step && step.getBoundingClientRect().top <= line) index = i;
      });
      setActiveIndex(index);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const active = STEPS[activeIndex] ?? STEPS[0];

  return (
    <section aria-label="How Mapped works" className="relative lg:hidden">
      {/* The map, pinned above the steps as they scroll up under it */}
      <div className="sticky top-0 z-20 h-[55svh] w-full overflow-hidden bg-[#e8eef0] shadow-[0_8px_24px_rgba(21,33,59,0.12)]">
        <Image
          src="/marketing-v3/hero-map.png"
          alt=""
          width={994}
          height={1842}
          unoptimized
          className="pointer-events-none absolute inset-0 size-full object-cover"
        />
        <HeroMap featureId={active.id} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#f0fbed] to-transparent" />
        {/* How far through the four */}
        <ol aria-hidden className="absolute inset-x-5 top-4 flex gap-1.5">
          {STEPS.map((step, index) => (
            <li
              key={step.id}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/60"
            >
              <span
                className={cn(
                  "block h-full rounded-full bg-[#15213b] transition-[width] duration-500",
                  index <= activeIndex ? "w-full" : "w-0",
                )}
              />
            </li>
          ))}
        </ol>
      </div>

      <ol className="relative z-10 flex flex-col px-5 pt-6 pb-[20svh]">
        {STEPS.map((step, index) => (
          <li
            key={step.id}
            ref={(element) => {
              stepRefs.current[index] = element;
            }}
            className="flex min-h-[48svh] items-start"
          >
            <div
              className={cn(
                "w-full rounded-xl bg-white p-5 shadow-[0_8px_30px_rgba(21,33,59,0.12)] transition-[opacity,translate] duration-500",
                index === activeIndex
                  ? "translate-y-0 opacity-100"
                  : "translate-y-3 opacity-60",
              )}
            >
              <p className="font-mono text-[11px] tracking-[0.13em] text-[#678de3] uppercase">
                {String(index + 1).padStart(2, "0")} · {step.detail?.label}
              </p>
              <h3 className="mt-2 text-[2rem] leading-none font-bold tracking-[-0.05em] text-[#15213b]">
                {step.title}
              </h3>
              {step.detail && (
                <p className="mt-3 text-[15px] leading-[1.45] text-[#15213b]/80">
                  {step.detail.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
