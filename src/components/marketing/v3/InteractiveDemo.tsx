"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { ANCHORED_CONNECTOR, HOTSPOTS, type Hotspot } from "./constants";

// Mapbox needs the browser, so show the static screenshot until it loads
const LiteMap = dynamic(() => import("./LiteMap/LiteMap"), {
  ssr: false,
  loading: () => (
    <Image
      src="/marketing-v3/screenshot-b.png"
      alt=""
      width={3024}
      height={1964}
      priority
      className="absolute top-[-5.36%] left-[-0.36%] h-[106.46%] w-[101.39%] max-w-none"
    />
  ),
});

const FRAME_WIDTH = 1440;

interface Connector {
  dot: { x: number; y: number };
  path: string;
}

// Line from the dot, round the corner, into the left edge of the demo
const buildConnector = ({
  direction,
  anchorY,
  endX,
  scale,
}: {
  direction: "above" | "below";
  anchorY: number;
  endX: number;
  scale: number;
}): Connector => {
  const { dotX, rise, cornerRadius } = ANCHORED_CONNECTOR;
  const x = dotX[direction] * scale;
  const sign = direction === "above" ? -1 : 1;
  const dotY = anchorY + sign * rise * scale;
  const r = cornerRadius * scale;
  return {
    dot: { x, y: dotY },
    path: `M ${x} ${dotY} V ${anchorY + sign * r} Q ${x} ${anchorY} ${x + r} ${anchorY} H ${endX}`,
  };
};

export default function InteractiveDemo() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [connectors, setConnectors] = useState<Record<string, Connector>>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Anchored connectors follow the sidebar rows, which move with the
  // viewport width, the map loading in and the boundary description
  useLayoutEffect(() => {
    const root = rootRef.current;
    const box = boxRef.current;
    if (!root || !box) {
      return;
    }

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rootRect = root.getBoundingClientRect();
        const scale = rootRect.width / FRAME_WIDTH;
        const endX = box.getBoundingClientRect().left - rootRect.left;
        const next: Record<string, Connector> = {};
        for (const hotspot of HOTSPOTS) {
          if (hotspot.position.type !== "anchored") {
            continue;
          }
          const anchor = root.querySelector(
            `[data-hotspot-anchor="${hotspot.id}"]`,
          );
          if (!anchor) {
            continue;
          }
          const rect = anchor.getBoundingClientRect();
          next[hotspot.id] = buildConnector({
            direction: hotspot.position.direction,
            anchorY: rect.top + rect.height / 2 - rootRect.top,
            endX,
            scale,
          });
        }
        setConnectors(next);
      });
    };

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(root);
    // Catches the map loading in and sidebar content changing
    const mutationObserver = new MutationObserver(measure);
    mutationObserver.observe(box, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  const getDotStyle = (hotspot: Hotspot) => {
    if (hotspot.position.type === "fixed") {
      return {
        left: `${hotspot.position.left}%`,
        top: `${hotspot.position.top}%`,
      };
    }
    const connector = connectors[hotspot.id];
    return connector
      ? { left: connector.dot.x, top: connector.dot.y }
      : { display: "none" };
  };

  return (
    // Hotspot highlights are styled inside the map with group-data-[active=…]/demo
    <div
      ref={rootRef}
      className="group/demo pointer-events-none absolute inset-0"
      data-active={activeId ?? undefined}
    >
      <svg aria-hidden className="absolute inset-0 size-full overflow-visible">
        {Object.entries(connectors).map(([id, connector]) => (
          <path
            key={id}
            d={connector.path}
            fill="none"
            stroke="#15213b"
            strokeWidth={1}
          />
        ))}
      </svg>

      <div
        ref={boxRef}
        className="pointer-events-auto absolute top-[20.304%] left-[13.819%] h-[70.033%] w-[72.431%] overflow-hidden rounded-[0.422cqw] bg-white shadow-[0px_2.682px_32.772px_2.261px_rgba(0,0,0,0.15)]"
      >
        <LiteMap />
      </div>

      {HOTSPOTS.map((hotspot, index) => (
        <Tooltip
          key={hotspot.id}
          open={activeId === hotspot.id}
          onOpenChange={(open) =>
            setActiveId((current) =>
              open ? hotspot.id : current === hotspot.id ? null : current,
            )
          }
        >
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={hotspot.title}
              className="group pointer-events-auto absolute z-10 flex size-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-[#15213b]"
              style={getDotStyle(hotspot)}
            >
              <span
                aria-hidden
                className="absolute size-[0.972cqw] rounded-full bg-[#15213b] group-hover:opacity-0 motion-safe:animate-ping"
                style={{ animationDelay: `${index * 400}ms` }}
              />
              <span
                aria-hidden
                className="relative size-[0.972cqw] rounded-full bg-[#15213b] transition-transform duration-200 group-hover:scale-150 group-focus-visible:scale-150"
              />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side={hotspot.tooltipSide}
            align={hotspot.tooltipAlign}
            sideOffset={12}
            className="max-w-72 rounded-md bg-[#15213b] px-4 py-3 text-left text-white [&_svg]:bg-[#15213b] [&_svg]:fill-[#15213b]"
          >
            <span className="font-mono text-[10px] tracking-widest text-[#91e17e] uppercase">
              {hotspot.label}
            </span>
            <p className="mt-1 text-base font-medium tracking-tight">
              {hotspot.title}
            </p>
            <p className="mt-1 text-sm leading-snug text-pretty text-white/80">
              {hotspot.description}
            </p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
