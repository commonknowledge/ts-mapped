"use client";

import { LayersIcon, MapPinIcon, TargetIcon, TrophyIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/shadcn/utils";
import {
  SHOWCASE_FEATURES,
  SHOWCASE_MEMBER_POINTS,
  SHOWCASE_TARGETS,
  type ShowcaseFeatureId,
} from "./constants";

const ICONS: Record<ShowcaseFeatureId, typeof MapPinIcon> = {
  members: MapPinIcon,
  data: LayersIcon,
  strategise: TargetIcon,
  win: TrophyIcon,
};

// Abstract stand-ins for overlaid datasets
const DATA_BLOBS = [
  { cx: 330, cy: 210, r: 95, fill: "#e4003b" },
  { cx: 420, cy: 420, r: 110, fill: "#0087dc" },
  { cx: 300, cy: 560, r: 90, fill: "#faa61a" },
  { cx: 170, cy: 650, r: 70, fill: "#02a95b" },
  { cx: 470, cy: 640, r: 75, fill: "#12b6cf" },
];

// Positions are percentages of the 1440 × 879 features frame, like the hero
export default function FeatureShowcase() {
  const [activeId, setActiveId] = useState<ShowcaseFeatureId>("members");
  const active =
    SHOWCASE_FEATURES.find((f) => f.id === activeId) ?? SHOWCASE_FEATURES[0];

  const overlayClass = (id: ShowcaseFeatureId) =>
    cn(
      "absolute inset-0 size-full transition-opacity duration-500",
      activeId === id ? "opacity-100" : "opacity-0",
    );

  return (
    <div className="relative aspect-[1440/879] w-full text-[#15213b]">
      {/* The map image re-tints and animates to illustrate the active feature */}
      <div
        id="feature-showcase-panel"
        role="tabpanel"
        aria-label={active.title}
        className="absolute top-[5.916%] left-[3.125%] h-[87.827%] w-[39.514%] overflow-hidden"
      >
        <Image
          src="/marketing-v3/map-dithered.png"
          alt=""
          width={569}
          height={772}
          unoptimized
          className="size-full [image-rendering:pixelated]"
        />
        <div
          className="absolute inset-0 mix-blend-multiply transition-colors duration-500"
          style={{ backgroundColor: active.color }}
        />

        <svg
          viewBox="0 0 569 772"
          preserveAspectRatio="none"
          aria-hidden
          className={overlayClass("members")}
        >
          {SHOWCASE_MEMBER_POINTS.map(([cx, cy], index) => (
            <circle
              key={`${cx}-${cy}`}
              cx={cx}
              cy={cy}
              r={7}
              fill="#15213b"
              stroke="#ffffff"
              strokeWidth={2}
              className={cn(
                "origin-center transition-transform duration-300 [transform-box:fill-box]",
                activeId === "members" ? "scale-100" : "scale-0",
              )}
              style={{ transitionDelay: `${index * 30}ms` }}
            />
          ))}
        </svg>

        <div className={overlayClass("data")} aria-hidden>
          <svg
            viewBox="0 0 569 772"
            preserveAspectRatio="none"
            className="absolute inset-0 size-full"
          >
            {DATA_BLOBS.map((blob, index) => (
              <circle
                key={blob.fill}
                {...blob}
                className={cn(
                  "origin-center mix-blend-multiply transition-all duration-500 [transform-box:fill-box]",
                  activeId === "data"
                    ? "scale-100 opacity-70"
                    : "scale-50 opacity-0",
                )}
                style={{ transitionDelay: `${index * 80}ms` }}
              />
            ))}
          </svg>
          <Image
            src="/marketing-v3/pattern-top.svg"
            alt=""
            width={464}
            height={443}
            // Starts below the tagline so the lines don't run through it
            className="absolute top-[14%] left-0 h-[86%] w-full opacity-30"
          />
        </div>

        <svg
          viewBox="0 0 569 772"
          preserveAspectRatio="none"
          aria-hidden
          className={overlayClass("strategise")}
        >
          {SHOWCASE_TARGETS.map(([cx, cy], index) => (
            <g key={`${cx}-${cy}`}>
              <circle
                cx={cx}
                cy={cy}
                r={46}
                fill="none"
                stroke="#15213b"
                strokeWidth={3}
                className="origin-center [transform-box:fill-box] motion-safe:animate-ping"
                style={{ animationDelay: `${index * 300}ms` }}
              />
              <circle
                cx={cx}
                cy={cy}
                r={46}
                fill="none"
                stroke="#15213b"
                strokeWidth={3}
              />
              <circle
                cx={cx}
                cy={cy}
                r={26}
                fill="none"
                stroke="#15213b"
                strokeWidth={3}
              />
              <circle cx={cx} cy={cy} r={8} fill="#15213b" />
              {/* Label on whichever side has room inside the image */}
              <text
                x={cx > 380 ? cx - 56 : cx + 56}
                y={cy + 5}
                textAnchor={cx > 380 ? "end" : "start"}
                className="fill-[#15213b] font-mono text-[15px] tracking-widest uppercase"
              >
                Priority {index + 1}
              </text>
            </g>
          ))}
        </svg>

        <svg
          viewBox="0 0 569 772"
          preserveAspectRatio="none"
          aria-hidden
          className={overlayClass("win")}
        >
          {SHOWCASE_TARGETS.map(([cx, cy], index) => (
            <g
              key={`${cx}-${cy}`}
              className={cn(
                "origin-center transition-transform duration-500 [transform-box:fill-box]",
                activeId === "win" ? "scale-100" : "scale-0",
              )}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <circle cx={cx} cy={cy} r={34} fill="#15213b" />
              <path
                d={`M${cx - 14} ${cy} l10 10 l18 -20`}
                fill="none"
                stroke="#b6e6ab"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}
        </svg>

        <p className="absolute top-[4.793%] left-[3.603%] w-[53.954%] text-[1.25cqw] leading-[0.98] tracking-[-0.01em] text-balance">
          The only mapping tool built by and for political organisers
        </p>
      </div>

      <div
        role="tablist"
        aria-label="What you can do with Mapped"
        aria-orientation="vertical"
        className="absolute top-[5.916%] right-[3.125%] flex h-[87.827%] w-[51.875%] flex-col"
      >
        {SHOWCASE_FEATURES.map((feature, index) => {
          const Icon = ICONS[feature.id];
          const isActive = feature.id === activeId;
          return (
            <button
              key={feature.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="feature-showcase-panel"
              onMouseEnter={() => setActiveId(feature.id)}
              onFocus={() => setActiveId(feature.id)}
              onClick={() => setActiveId(feature.id)}
              className={cn(
                "relative flex min-h-0 cursor-pointer items-center gap-[1.5cqw] border-t border-[#15213b]/15 px-[1.4cqw] text-left transition-[flex-grow,background-color,color] duration-500 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#15213b]",
                isActive ? "grow-[2.2] text-[#333]" : "grow",
              )}
              style={{ backgroundColor: isActive ? feature.color : undefined }}
            >
              <span className="absolute top-[0.8cqw] left-[0.9cqw] font-mono text-[1.4cqw] leading-none font-semibold opacity-50">
                {index + 1}
              </span>
              <Icon
                aria-hidden
                strokeWidth={1.5}
                className={cn(
                  "shrink-0 transition-[width,height] duration-500",
                  isActive ? "size-[5cqw]" : "size-[3cqw]",
                )}
              />
              <span
                className={cn(
                  "w-[19cqw] shrink-0 font-medium tracking-[-0.062em] transition-[font-size] duration-500",
                  isActive ? "text-[4.362cqw]" : "text-[3cqw]",
                  // After the font size, or tailwind-merge drops it
                  "leading-none",
                )}
              >
                {feature.title}
              </span>
              <span
                className={cn(
                  "grid min-w-0 flex-1 transition-[grid-template-rows,opacity] duration-500",
                  isActive
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0",
                )}
              >
                <span className="overflow-hidden">
                  <span className="block font-mono text-[0.972cqw] tracking-[0.06em] uppercase opacity-50">
                    {feature.label}
                  </span>
                  <span className="mt-[0.7cqw] block text-[1.18cqw] leading-[1.3] text-balance">
                    {feature.description}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
