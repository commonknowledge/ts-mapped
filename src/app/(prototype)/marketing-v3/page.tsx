import { Work_Sans } from "next/font/google";
import Image from "next/image";
import { Link } from "@/components/Link";
import FeatureShowcase from "@/components/marketing/v3/FeatureShowcase";
import InteractiveDemo from "@/components/marketing/v3/InteractiveDemo";
import type { Metadata } from "next";

// Prototype of the Mapped V3 marketing hero (Figma node 5969:15037).
// Everything is positioned as a percentage of the 1440 × 921 frame and type
// is sized in container query units, so the whole stage scales together.

const workSans = Work_Sans({ subsets: ["latin"], weight: ["400"] });

export const metadata: Metadata = {
  title: "Mapped — V3 prototype",
  robots: { index: false },
};

const NAV_ITEMS = [
  { label: "Solutions", href: "/features" },
  { label: "Docs", href: "/docs" },
  { label: "News", href: "/news" },
  { label: "About", href: "/about" },
];

const LOGO_DOTS = [
  { src: "/marketing-v3/ellipse-45.svg", left: 9.184, top: 8.333 },
  { src: "/marketing-v3/ellipse-47.svg", left: 15.295, top: 6.433 },
  { src: "/marketing-v3/ellipse-46.svg", left: 6.128, top: 4.506 },
];

const CONNECTORS = [
  // Group 39: rotated 180°
  {
    id: "inspector",
    src: "/marketing-v3/connector-39.svg",
    left: 85.694,
    top: 52.552,
    width: 4.792,
    height: 6.243,
    rotate: 180,
  },
  // Group 40: rotated 90°, so the box is placed unrotated around its centre
  {
    id: "views",
    src: "/marketing-v3/connector-40.svg",
    left: 33.958,
    top: 13.545,
    width: 3.403,
    height: 9.718,
    rotate: 90,
  },
];

export default function MarketingV3Page() {
  return (
    <main className="min-h-screen bg-white text-[#15213b]">
      <section className="@container relative w-full overflow-hidden">
        <div className="relative aspect-[1440/921] w-full bg-[#f0fbed]">
          {/* Dithered map strip down the right edge */}
          <Image
            src="/marketing-v3/map-strip.png"
            alt=""
            width={81}
            height={921}
            unoptimized
            className="absolute top-0 left-[94.375%] h-full w-[5.625%] [image-rendering:pixelated]"
          />

          {/* Boundary pattern, top right */}
          <div className="absolute top-[-2.172%] left-[70.278%] h-[50.706%] w-[32.5%]">
            <Image
              src="/marketing-v3/pattern-top.svg"
              alt=""
              width={464}
              height={443}
              className="absolute top-[0.21%] left-[0.21%] h-[94.78%] w-[99.07%] max-w-none"
            />
          </div>

          {/* Boundary pattern, bottom left */}
          <Image
            src="/marketing-v3/pattern-bottom.svg"
            alt=""
            width={468}
            height={452}
            className="absolute top-[50.923%] left-[-4.306%] h-[49.077%] w-[32.5%] rotate-180"
          />

          {/* Wordmark */}
          <Link
            href="/"
            className="absolute top-[2.389%] left-[3.056%] w-[15.278%]"
          >
            <Image
              src="/marketing-v3/wordmark.png"
              alt="Mapped"
              width={220}
              height={72}
              priority
              className="h-auto w-full"
            />
          </Link>
          {LOGO_DOTS.map((dot) => (
            <Image
              key={dot.src}
              src={dot.src}
              alt=""
              width={8}
              height={8}
              className="pointer-events-none absolute w-[0.556%]"
              style={{ left: `${dot.left}%`, top: `${dot.top}%` }}
            />
          ))}

          <p className="absolute top-[11.618%] left-[3.056%] w-[21.319%] text-[1.25cqw] leading-[0.98] tracking-[-0.01em] text-balance">
            The only mapping tool built by and for political organisers
          </p>

          <nav
            className={`${workSans.className} absolute top-[2.28%] left-[39.722%] flex items-center gap-[0.903cqw]`}
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="p-[0.694cqw] text-[1.25cqw] leading-[0.98] tracking-[-0.02em] hover:underline"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/login"
            className={`${workSans.className} absolute top-[4.777%] left-[89.583%] flex h-[4.126%] w-[5%] items-center justify-center bg-[#ff6b6b] text-[1.25cqw] leading-[0.98] tracking-[-0.02em] hover:bg-[#ff5252]`}
          >
            Login
          </Link>

          {CONNECTORS.map((connector) => (
            <Image
              key={connector.id}
              src={connector.src}
              alt=""
              width={69}
              height={58}
              className="pointer-events-none absolute"
              style={{
                left: `${connector.left}%`,
                top: `${connector.top}%`,
                width: `${connector.width}%`,
                height: `${connector.height}%`,
                rotate: `${connector.rotate}deg`,
              }}
            />
          ))}

          {/* Live, lite version of the map editor, with the feature hotspots */}
          <InteractiveDemo />
        </div>
      </section>

      {/* Features, inspired by the A2 poster (Figma node 5974:15222) */}
      <section className="@container relative w-full overflow-hidden">
        <FeatureShowcase />
      </section>
    </main>
  );
}
