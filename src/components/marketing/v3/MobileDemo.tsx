"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { MOBILE_DEMO_SIZE } from "./constants";

const LiteMap = dynamic(() => import("./LiteMap/LiteMap"), {
  ssr: false,
  loading: () => (
    <Image
      src="/marketing-v3/screenshot-b.png"
      alt=""
      width={3024}
      height={1964}
      className="absolute inset-0 size-full object-cover object-left-top"
    />
  ),
});

/**
 * The desktop demo for phones: laid out at its desktop size, scaled down to
 * fit, and inert, as it's too small to use. Loads the map only once shown.
 */
export default function MobileDemo() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () =>
      setScale(frame.getBoundingClientRect().width / MOBILE_DEMO_SIZE.width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      className="relative w-full overflow-hidden rounded-lg bg-white shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
      style={{
        aspectRatio: `${MOBILE_DEMO_SIZE.width} / ${MOBILE_DEMO_SIZE.height}`,
      }}
      role="img"
      aria-label="Mapped map editor showing layers, boundaries and markers"
    >
      {scale > 0 && (
        <div
          inert
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 origin-top-left font-sans select-none"
          style={{
            width: MOBILE_DEMO_SIZE.width,
            height: MOBILE_DEMO_SIZE.height,
            transform: `scale(${scale})`,
          }}
        >
          <LiteMap />
        </div>
      )}
    </div>
  );
}
