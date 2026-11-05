import { MonitorIcon } from "lucide-react";
import { Manrope } from "next/font/google";
import Image from "next/image";
import { Link } from "@/components/Link";
import HeroFeatures from "@/components/marketing/v3/HeroFeatures";
import InteractiveDemo from "@/components/marketing/v3/InteractiveDemo";
import MobileDemo from "@/components/marketing/v3/MobileDemo";
import MobileMenu from "@/components/marketing/v3/MobileMenu";
import type { Metadata } from "next";
import type { ReactNode } from "react";

// The Mapped landing page (V3 design, Figma node 5986:89209). From lg up,
// each section is a fixed-ratio stage: positions are percentages of its
// frame and type is sized in container query units (1cqw = 14.4px at 1440
// wide). Below lg, sections stack in normal document flow with rem type.

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

// Phones show three stories, each with a picture
const MOBILE_NEWS = [
  { ...NEWS_POSTS[0], image: "/marketing-v3/news-1.png" },
  { ...NEWS_POSTS[0], image: "/marketing-v3/news-2.png" },
  { ...NEWS_POSTS[0], image: "/marketing-v3/hero-map.png" },
];

const USED_BY_LOGOS = [
  {
    src: "/marketing-v3/logo-hope-not-hate.png",
    alt: "Hope not Hate",
    width: 1024,
    height: 575,
  },
  {
    src: "/marketing-v3/logo-gmtu.png",
    alt: "Greater Manchester Tenants Union",
    width: 116,
    height: 61,
    cover: true,
  },
  {
    src: "/marketing-v3/logo-civic-power-fund.svg",
    alt: "Civic Power Fund",
    width: 76,
    height: 55,
  },
  {
    src: "/marketing-v3/logo-green-new-deal.png",
    alt: "Green New Deal Rising",
    width: 1000,
    height: 1000,
    crop: true,
  },
] as const;

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
  size = "default",
}: {
  href: string;
  children: string;
  variant: "white" | "coral";
  size?: "default" | "compact";
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-center border border-white/80 leading-[0.98] font-bold tracking-[-0.02em] whitespace-nowrap text-[#16223c] drop-shadow-[0_0_8px_rgba(0,0,0,0.08)] lg:h-[2.639cqw] lg:rounded-[0.191cqw] lg:px-[0.694cqw] lg:text-[1.111cqw] lg:drop-shadow-[0_0_0.53cqw_rgba(0,0,0,0.08)] ${
        size === "compact"
          ? "h-9 rounded px-2.5 text-xs"
          : "h-10 rounded px-3 text-sm"
      } ${
        variant === "white"
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
  subtitle: ReactNode;
  tone: "light" | "dark";
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-[4.028cqw]">
      <h2
        className={`text-3xl leading-none font-bold tracking-[-0.052em] lg:p-[0.694cqw] lg:text-[2.696cqw] lg:whitespace-nowrap ${
          tone === "dark" ? "text-white" : "text-[#15213b]"
        }`}
      >
        {title}
      </h2>
      <p
        className={`max-w-sm font-mono text-[11px] leading-[1.08] tracking-[0.13em] text-balance uppercase opacity-50 lg:mt-[0.764cqw] lg:w-[33.194cqw] lg:max-w-none lg:text-[.75cqw] ${
          tone === "dark" ? "text-white" : "text-[#15213b]"
        }`}
      >
        {subtitle}
      </p>
    </div>
  );
}

function UsedByLogos({ className }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-2 lg:gap-[0.208cqw] ${className ?? ""}`}>
      <p className="px-1 font-mono text-[11px] leading-[1.3] font-medium tracking-[0.06em] text-[#333] uppercase opacity-50 lg:px-[0.642cqw] lg:text-[0.812cqw]">
        Used by
      </p>
      <div className="flex flex-wrap items-center gap-4 mix-blend-luminosity lg:items-start lg:justify-center lg:gap-[0.58cqw]">
        {USED_BY_LOGOS.map((logo) =>
          "cover" in logo && logo.cover ? (
            <div
              key={logo.src}
              className="relative h-10 w-[4.75rem] lg:h-[4.253cqw] lg:w-[8.049cqw]"
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                fill
                sizes="116px"
                className="object-cover"
              />
            </div>
          ) : "crop" in logo && logo.crop ? (
            <div
              key={logo.src}
              className="flex h-10 w-16 items-center px-1 py-1 lg:h-[4.253cqw] lg:w-[6.399cqw] lg:px-[0.58cqw] lg:py-[0.464cqw]"
            >
              {/* The logo sits in the middle of a square file */}
              <div className="relative aspect-[143/73] w-full overflow-hidden">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.width}
                  height={logo.height}
                  className="absolute top-[-48.17%] left-[-0.23%] h-[195.89%] w-full max-w-none"
                />
              </div>
            </div>
          ) : (
            <div
              key={logo.src}
              className="flex h-10 w-16 items-center lg:h-[4.253cqw] lg:w-[6.399cqw] lg:px-[0.58cqw]"
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                className="h-auto w-full"
              />
            </div>
          ),
        )}
      </div>
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
        <div className="relative flex flex-col bg-[#f0fbed] lg:block lg:aspect-[1440/921]">
          {/* Boundary pattern — corner accent on mobile, Figma placement on lg */}
          <Image
            src="/marketing-v3/pattern-hero.svg"
            alt=""
            width={468}
            height={467}
            className="pointer-events-none absolute top-0 right-0 z-[1] aspect-[468/467] h-auto w-36 max-w-none opacity-40 lg:top-[-2.172%] lg:right-auto lg:left-[70.278%] lg:z-auto lg:w-[32.5%] lg:opacity-100"
          />

          {/* Desktop wordmark + nav (Figma frame). Mobile chrome sits on the map. */}
          <Link
            href="/"
            className="absolute top-[1.737%] left-[1.528%] z-20 hidden w-[15.278%] lg:block"
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

          <nav className="absolute top-[2.28%] left-[39.722%] z-20 hidden w-[57.361%] items-center justify-between lg:flex">
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

          {/* Phones: the wordmark (in ink, as the white one needs the map
              behind it) and a menu; no login, as the app needs a desktop */}
          <div className="relative z-20 flex items-center justify-between px-5 pt-4 pb-6 lg:hidden">
            <Link href="/" className="w-24 shrink-0">
              <Image
                src="/logo-wordmark-ink.svg"
                alt="Mapped"
                width={220}
                height={72}
                priority
                className="h-auto w-full"
              />
            </Link>
            <MobileMenu
              items={NAV_ITEMS}
              requestAccessUrl={REQUEST_ACCESS_URL}
            />
          </div>

          <HeroFeatures
            intro={
              <h1 className="w-full max-w-md font-mono text-[11px] leading-[1.08] tracking-[0.13em] text-balance uppercase opacity-50 lg:w-[70%] lg:max-w-none lg:text-[.75cqw]">
                Geographic Mapping tool for political organisers
              </h1>
            }
            actions={
              <div className="flex flex-wrap items-center gap-2 lg:gap-[0.694cqw]">
                <Button href={REQUEST_ACCESS_URL} variant="white">
                  Request Access
                </Button>
                {/* Signing in needs a desktop */}
                <span className="hidden lg:contents">
                  <Button href="/login" variant="coral">
                    Login
                  </Button>
                </span>
              </div>
            }
          />

          {/* Used by — flow on mobile, absolute on desktop */}
          <UsedByLogos className="relative border-t border-[#15213b]/10 px-5 py-6 lg:absolute lg:top-[85.125%] lg:left-[39.931%] lg:w-[28.986%] lg:border-0 lg:px-0 lg:py-0" />

          <p className="relative z-10 px-5 pb-10 text-sm leading-[1.3] text-black opacity-50 lg:absolute lg:top-[83.279%] lg:left-[75.347%] lg:w-[21.944%] lg:px-0 lg:pb-0 lg:text-[1.111cqw]">
            Mapped was built for and with organisers: tenant unions, climate
            action groups, migrant solidarity organisations, divestment
            campaigns and more.
          </p>
        </div>
      </section>

      {/* Try it for yourself */}
      <section className="@container relative w-full overflow-clip bg-[#15213b]">
        <div className="relative flex flex-col lg:block lg:aspect-[1440/921]">
          <Image
            src="/marketing-v3/pattern-dark.svg"
            alt=""
            width={468}
            height={451}
            className="pointer-events-none absolute bottom-0 left-0 hidden aspect-[468/451] h-auto w-48 max-w-none rotate-180 opacity-40 lg:top-[51.031%] lg:bottom-auto lg:left-[-2.5%] lg:block lg:h-[48.969%] lg:w-[32.5%] lg:opacity-100"
          />

          <div className="relative z-10 px-5 pt-10 pb-6 lg:absolute lg:top-[4.452%] lg:left-[2.083%] lg:px-0 lg:pt-0 lg:pb-0">
            <SectionIntro
              title="Try it for yourself"
              subtitle={
                <>
                  <span className="lg:hidden">A look at the map editor</span>
                  <span className="hidden lg:inline">
                    Interact with the map to see the features
                  </span>
                </>
              }
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
              className="pointer-events-none absolute hidden max-w-none lg:block"
              style={connector.style}
            />
          ))}

          {/* Mobile: the same demo, scaled down and not interactive */}
          <div className="relative z-10 mx-auto mb-10 flex w-[calc(100%-2.5rem)] max-w-lg flex-col gap-4 lg:hidden">
            <MobileDemo />
            <p className="flex items-start gap-3 rounded-lg border border-white/15 bg-white/5 p-4 text-sm leading-[1.4] text-white/80">
              <MonitorIcon className="mt-0.5 size-4 shrink-0 text-white" />
              <span>
                To explore the map yourself, open this page on a desktop or
                laptop.
              </span>
            </p>
          </div>

          {/* Desktop: live lite map with feature hotspots */}
          <div className="pointer-events-none absolute inset-0 hidden lg:pointer-events-auto lg:block">
            <InteractiveDemo tone="dark" />
          </div>
        </div>
      </section>

      {/* News */}
      <section className="@container relative w-full overflow-clip">
        <div className="relative flex flex-col bg-white px-5 py-10 lg:aspect-[1440/933] lg:block lg:px-0 lg:py-0">
          <Image
            src="/marketing-v3/news-strip.png"
            alt=""
            width={176}
            height={1638}
            unoptimized
            className="absolute top-0 right-0 hidden h-[87.781%] w-[6.111%] [image-rendering:pixelated] lg:left-[93.889%] lg:right-auto lg:block"
          />

          <div className="relative z-10 mb-8 lg:absolute lg:top-[3.001%] lg:left-[2.153%] lg:mb-0">
            <SectionIntro
              title="News"
              subtitle="What we've been building, and who with"
              tone="light"
            />
          </div>

          {/* left/top only apply once lg:absolute kicks in; mobile stays in the grid */}
          {/* Phones: three stories, each with its picture */}
          <ul className="relative z-10 flex flex-col gap-10 lg:hidden">
            {MOBILE_NEWS.map((story, index) => (
              <li key={index}>
                <Link href={story.href} className="group flex flex-col gap-4">
                  <Image
                    src={story.image}
                    alt=""
                    width={774}
                    height={483}
                    className="aspect-[670/418] h-auto w-full rounded-sm object-cover"
                  />
                  <span className="flex flex-col gap-1.5">
                    <span className="font-mono text-[11px] leading-[0.85] font-semibold tracking-[0.08em] text-[#678de3] uppercase">
                      {story.date}
                    </span>
                    <span className="text-2xl leading-[1.05] font-bold tracking-[-0.042em] group-hover:underline">
                      {story.title}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="relative z-10 hidden lg:contents">
            {[
              {
                src: "/marketing-v3/news-1.png",
                left: "6.111%",
                top: "17.256%",
              },
              {
                src: "/marketing-v3/news-2.png",
                left: "38.611%",
                top: "26.153%",
              },
            ].map((card) => (
              <Link
                key={card.src}
                href={NEWS_POSTS[0].href}
                className="group flex w-full flex-col gap-4 lg:absolute lg:w-[26.875%] lg:gap-[2.153cqw]"
                style={{ left: card.left, top: card.top }}
              >
                <Image
                  src={card.src}
                  alt=""
                  width={774}
                  height={483}
                  className="aspect-[670/418] h-auto w-full"
                />
                <span className="flex flex-col gap-1 lg:gap-[0.278cqw]">
                  <span className="font-mono text-[11px] leading-[0.85] font-semibold tracking-[0.08em] text-[#678de3] uppercase lg:text-[0.903cqw]">
                    {NEWS_POSTS[0].date}
                  </span>
                  <span className="text-2xl leading-none font-bold tracking-[-0.042em] group-hover:underline lg:text-[2.696cqw]">
                    {NEWS_POSTS[0].title}
                  </span>
                </span>
              </Link>
            ))}
          </div>

          <ul className="relative z-10 mt-10 hidden flex-col gap-8 border-t border-[#15213b]/10 pt-8 lg:absolute lg:flex lg:top-[17.256%] lg:left-[71.042%] lg:mt-0 lg:w-[18.75%] lg:gap-[3.333cqw] lg:border-0 lg:pt-0">
            {[1, 2, 3].map((i) => (
              <li key={i}>
                <Link
                  href={NEWS_POSTS[0].href}
                  className="group flex flex-col gap-1 lg:gap-[0.278cqw]"
                >
                  <span className="font-mono text-[11px] leading-[0.85] font-semibold tracking-[0.08em] text-[#678de3] uppercase lg:text-[0.903cqw]">
                    {NEWS_POSTS[0].date}
                  </span>
                  <span className="text-lg leading-none font-bold tracking-[-0.032em] group-hover:underline lg:text-[1.667cqw]">
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
        <div className="relative flex flex-col bg-white px-5 pt-10 pb-8 lg:aspect-[1440/527] lg:block lg:px-0 lg:pt-0 lg:pb-0">
          <Image
            src="/marketing-v3/footer-rule.svg"
            alt=""
            width={1379}
            height={1}
            className="absolute top-0 left-5 w-[calc(100%-2.5rem)] max-w-none lg:left-[2.083%] lg:w-[95.764%]"
          />

          <div className="relative z-10 flex flex-col gap-6 text-sm leading-[1.3] text-black lg:absolute lg:top-[4.08%] lg:left-[2.083%] lg:w-[95.764%] lg:flex-row lg:items-start lg:gap-[1.545cqw] lg:text-[1.111cqw]">
            <p className="text-2xl leading-none font-bold tracking-[-0.032em] text-[#15213b] lg:w-[30.764cqw] lg:text-[1.667cqw]">
              Made for the movement,
              <br />
              by the movement
            </p>
            <div className="flex flex-col gap-4 sm:flex-row lg:flex-1 lg:items-start lg:gap-[1.528cqw]">
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
            className="pointer-events-none relative mt-8 h-auto w-full max-w-none lg:absolute lg:top-[10.911%] lg:left-[1.944%] lg:mt-0 lg:w-[96.25%]"
          />

          <div className="relative z-10 mt-6 flex items-center justify-between gap-4 text-sm leading-[1.3] text-black lg:static lg:mt-0 lg:text-[1.111cqw]">
            <p className="lg:absolute lg:top-[93.454%] lg:left-[1.944%]">
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
              className="underline hover:no-underline lg:absolute lg:top-[93.454%] lg:left-[90.139%]"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
