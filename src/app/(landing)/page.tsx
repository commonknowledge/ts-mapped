import { Manrope } from "next/font/google";
import Image from "next/image";
import { Link } from "@/components/Link";
import HeroFeatures from "@/components/marketing/v3/HeroFeatures";
import InteractiveDemo from "@/components/marketing/v3/InteractiveDemo";
import type { Metadata } from "next";

// The Mapped landing page (V3 design, Figma node 5986:89209). Each
// section is a fixed-ratio stage: positions are percentages of its frame and
// type is sized in container query units (1cqw = 14.4px at 1440 wide), so
// everything scales together.

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "Mapped — mapping for political organisers",
};

// The waitlist form, as linked from the login page
const REQUEST_ACCESS_URL =
  "https://us19.list-manage.com/survey?u=7d61a70102ab811e6282bee60&id=089628c6aa&attribution=false";

const NAV_ITEMS = [
  { label: "Solutions", href: "/features" },
  { label: "Docs", href: "/docs" },
  { label: "News", href: "/news" },
  { label: "About", href: "/about" },
];

const NEWS_POSTS = [
  {
    date: "September 17, 2025",
    title: "Building Software That Lasts: Lessons from Mapped",
    href: "/news",
  },
];

// The white connectors leading into the demo; group 40 is rotated 90°, so
// its unrotated box is placed around the same centre
const DEMO_CONNECTORS = [
  {
    id: "views",
    src: "/marketing-v3/connector-40.svg",
    width: 47.5,
    height: 86.25,
    style: {
      left: "35.5%",
      top: "11.14%",
      width: "3.299%",
      height: "9.365%",
      rotate: "90deg",
    },
  },
  {
    id: "inspector",
    src: "/marketing-v3/connector-39.svg",
    width: 67,
    height: 55.5,
    style: {
      left: "87.29%",
      top: "49.89%",
      width: "4.653%",
      height: "6.026%",
      rotate: "180deg",
    },
  },
];

function Button({
  href,
  children,
  variant,
}: {
  href: string;
  children: string;
  variant: "white" | "coral";
}) {
  return (
    <Link
      href={href}
      className={`flex h-[2.639cqw] items-center justify-center rounded-[0.191cqw] border border-white/80 px-[0.694cqw] text-[1.111cqw] leading-[0.98] font-bold tracking-[-0.02em] whitespace-nowrap text-[#16223c] drop-shadow-[0_0_0.53cqw_rgba(0,0,0,0.08)] ${variant === "white"
        ? "bg-white hover:bg-neutral-50"
        : "bg-[#ff6b6b] hover:bg-[#ff5252]"
        }`}
    >
      {children}
    </Link>
  );
}

function SectionIntro({
  title,
  subtitle,
  tone,
}: {
  title: string;
  subtitle: string;
  tone: "light" | "dark";
}) {
  return (
    <div className="flex items-start gap-[4.028cqw]">
      <h2
        className={`p-[0.694cqw] text-[2.696cqw] leading-none font-bold tracking-[-0.052em] whitespace-nowrap ${tone === "dark" ? "text-white" : "text-[#15213b]"
          }`}
      >
        {title}
      </h2>
      <p
        className={`mt-[0.764cqw] w-[33.194cqw] font-mono text-[.75cqw] leading-[1.08] tracking-[0.13em] text-balance uppercase opacity-50 ${tone === "dark" ? "text-white" : "text-[#15213b]"
          }`}
      >
        {subtitle}
      </p>
    </div>
  );
}

export default function MarketingV3Page() {
  return (
    <main
      className={`${manrope.className} min-h-screen bg-white text-[#15213b]`}
    >
      {/* Hero */}
      <section className="@container relative w-full overflow-clip">
        {/* Fills the viewport; type still scales with the width */}
        <div className="relative h-svh min-h-[40cqw] w-full bg-[#f0fbed]">
          <HeroFeatures
            intro={
              <h1 className="w-[70%] font-mono text-[.75cqw] leading-[1.08] tracking-[0.13em] text-balance uppercase opacity-50">
                Geographic Mapping tool for political organisers
              </h1>
            }
            actions={
              <div className="flex items-center gap-[0.694cqw]">
                <Button href={REQUEST_ACCESS_URL} variant="white">
                  Request Access
                </Button>
                <Button href="/login" variant="coral">
                  Login
                </Button>
              </div>
            }
          />

          {/* Boundary pattern, top right */}
          <Image
            src="/marketing-v3/pattern-hero.svg"
            alt=""
            width={468}
            height={467}
            className="pointer-events-none absolute top-[-2.172%] left-[70.278%] h-[50.706%] w-[32.5%] max-w-none"
          />

          {/* Wordmark, over the map */}
          <Link
            href="/"
            className="absolute top-[1.737%] left-[1.528%] w-[15.278%]"
          >
            <Image
              src="/marketing-v3/wordmark-header.svg"
              alt="Mapped"
              width={220}
              height={72}
              priority
              className="h-auto w-full"
            />
          </Link>

          <nav className="absolute top-[2.28%] left-[39.722%] flex w-[57.361%] items-center justify-between">
            <ul className="flex items-center gap-[0.903cqw]">
              {NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="block p-[0.694cqw] text-[1cqw] leading-[0.98] font-medium tracking-[-0.01em] hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-[0.694cqw]">
              <Button href={REQUEST_ACCESS_URL} variant="white">
                Request Access
              </Button>
              <Button href="/login" variant="coral">
                Login
              </Button>
            </div>
          </nav>

          {/* Used by */}
          <div className="absolute top-[85.125%] left-[39.931%] flex w-[28.986%] flex-col gap-[0.208cqw]">
            <p className="px-[0.642cqw] font-mono text-[0.812cqw] leading-[1.3] font-medium tracking-[0.06em] text-[#333] uppercase opacity-50">
              Used by
            </p>
            <div className="flex items-start justify-center gap-[0.58cqw] mix-blend-luminosity">
              <div className="flex h-[4.253cqw] w-[6.399cqw] items-center">
                <Image
                  src="/marketing-v3/logo-hope-not-hate.png"
                  alt="Hope not Hate"
                  width={1024}
                  height={575}
                  className="h-auto w-full"
                />
              </div>
              <div className="relative h-[4.253cqw] w-[8.049cqw]">
                <Image
                  src="/marketing-v3/logo-gmtu.png"
                  alt="Greater Manchester Tenants Union"
                  fill
                  sizes="116px"
                  className="object-cover"
                />
              </div>
              <div className="flex h-[4.253cqw] w-[6.399cqw] items-center px-[0.58cqw]">
                <Image
                  src="/marketing-v3/logo-civic-power-fund.svg"
                  alt="Civic Power Fund"
                  width={76}
                  height={55}
                  className="h-auto w-full"
                />
              </div>
              <div className="flex h-[4.253cqw] w-[6.399cqw] items-center px-[0.58cqw] py-[0.464cqw]">
                {/* The logo sits in the middle of a square file */}
                <div className="relative aspect-[143/73] w-full overflow-hidden">
                  <Image
                    src="/marketing-v3/logo-green-new-deal.png"
                    alt="Green New Deal Rising"
                    width={1000}
                    height={1000}
                    className="absolute top-[-48.17%] left-[-0.23%] h-[195.89%] w-full max-w-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <p className="absolute top-[83.279%] left-[75.347%] w-[21.944%] text-[1.111cqw] leading-[1.3] text-black opacity-50">
            Mapped was built for and with organisers: tenant unions, climate
            action groups, migrant solidarity organisations, divestment
            campaigns and more.
          </p>
        </div>
      </section>

      {/* Try it for yourself */}
      <section className="@container relative w-full overflow-clip">
        <div className="relative aspect-[1440/921] w-full bg-[#15213b]">
          <Image
            src="/marketing-v3/pattern-dark.svg"
            alt=""
            width={468}
            height={451}
            className="pointer-events-none absolute top-[51.031%] left-[-2.5%] h-[48.969%] w-[32.5%] max-w-none rotate-180"
          />

          <div className="absolute top-[4.452%] left-[2.083%]">
            <SectionIntro
              title="Try it for yourself"
              subtitle="Interact with the map to see the features"
              tone="dark"
            />
          </div>

          {DEMO_CONNECTORS.map((connector) => (
            <Image
              key={connector.id}
              src={connector.src}
              alt=""
              width={connector.width}
              height={connector.height}
              className="pointer-events-none absolute max-w-none"
              style={connector.style}
            />
          ))}

          {/* Live, lite version of the map editor, with the feature hotspots */}
          <InteractiveDemo tone="dark" />
        </div>
      </section>

      {/* News */}
      <section className="@container relative w-full overflow-clip">
        <div className="relative aspect-[1440/933] w-full bg-white">
          <Image
            src="/marketing-v3/news-strip.png"
            alt=""
            width={176}
            height={1638}
            unoptimized
            className="absolute top-0 left-[93.889%] h-[87.781%] w-[6.111%] [image-rendering:pixelated]"
          />

          <div className="absolute top-[3.001%] left-[2.153%]">
            <SectionIntro
              title="News"
              subtitle="Interact with the map to see the features"
              tone="light"
            />
          </div>

          {[
            { src: "/marketing-v3/news-1.png", left: "6.111%", top: "17.256%" },
            {
              src: "/marketing-v3/news-2.png",
              left: "38.611%",
              top: "26.153%",
            },
          ].map((card) => (
            <Link
              key={card.src}
              href={NEWS_POSTS[0].href}
              className="group absolute flex w-[26.875%] flex-col gap-[2.153cqw]"
              style={{ left: card.left, top: card.top }}
            >
              <Image
                src={card.src}
                alt=""
                width={774}
                height={483}
                className="aspect-[670/418] h-auto w-full"
              />
              <span className="flex flex-col gap-[0.278cqw]">
                <span className="font-mono text-[0.903cqw] leading-[0.85] font-semibold tracking-[0.08em] text-[#678de3] uppercase">
                  {NEWS_POSTS[0].date}
                </span>
                <span className="text-[2.696cqw] leading-none font-bold tracking-[-0.042em] group-hover:underline">
                  {NEWS_POSTS[0].title}
                </span>
              </span>
            </Link>
          ))}

          <ul className="absolute top-[17.256%] left-[71.042%] flex w-[18.75%] flex-col gap-[3.333cqw]">
            {[1, 2, 3].map((i) => (
              <li key={i}>
                <Link
                  href={NEWS_POSTS[0].href}
                  className="group flex flex-col gap-[0.278cqw]"
                >
                  <span className="font-mono text-[0.903cqw] leading-[0.85] font-semibold tracking-[0.08em] text-[#678de3] uppercase">
                    {NEWS_POSTS[0].date}
                  </span>
                  <span className="text-[1.667cqw] leading-none font-bold tracking-[-0.032em] group-hover:underline">
                    {NEWS_POSTS[0].title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="@container relative w-full overflow-clip">
        <div className="relative aspect-[1440/527] w-full bg-white">
          <Image
            src="/marketing-v3/footer-rule.svg"
            alt=""
            width={1379}
            height={1}
            className="absolute top-0 left-[2.083%] w-[95.764%] max-w-none"
          />

          <div className="absolute top-[4.08%] left-[2.083%] flex w-[95.764%] items-start gap-[1.545cqw] text-[1.111cqw] leading-[1.3] text-black">
            <p className="w-[30.764cqw] text-[1.667cqw] leading-none font-bold tracking-[-0.032em] text-[#15213b]">
              Made for the movement,
              <br />
              by the movement
            </p>
            <div className="flex flex-1 items-start gap-[1.528cqw]">
              <p className="flex-1">
                Mapped was built for and with organisers: tenant unions, climate
                action groups, migrant solidarity organisations, divestment
                campaigns and more.
              </p>
              <p className="flex-1">
                It’s a project by Common Knowledge, a not-for-profit worker
                cooperative that uses digital technology to build power for
                social movements.
              </p>
            </div>
          </div>

          <Image
            src="/marketing-v3/wordmark-footer.svg"
            alt="Mapped"
            width={1386}
            height={452}
            className="pointer-events-none absolute top-[10.911%] left-[1.944%] h-auto w-[96.25%] max-w-none"
          />

          <p className="absolute top-[93.454%] left-[1.944%] text-[1.111cqw] leading-[1.3] text-black">
            Made by{" "}
            <a
              href="https://commonknowledge.coop"
              className="underline hover:no-underline"
            >
              Common Knowledge
            </a>
          </p>
          <Link
            href="/privacy"
            className="absolute top-[93.454%] left-[90.139%] text-[1.111cqw] leading-[1.3] text-black underline hover:no-underline"
          >
            Privacy Policy
          </Link>
        </div>
      </footer>
    </main>
  );
}
