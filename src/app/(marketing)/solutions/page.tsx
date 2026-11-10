import { Link } from "@/components/Link";
import MarketingPageHero from "@/components/marketing/v3/MarketingPageHero";
import { SOLUTIONS } from "@/content/marketing/solutions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solutions — Mapped",
  description: "What organisers use Mapped for.",
};

export default function SolutionsPage() {
  return (
    <main>
      <MarketingPageHero
        eyebrow="Solutions"
        title="What organisers use Mapped for"
        description="From seeing where your members are to choosing the seats to fight in, here's how Mapped helps."
      />
      <div className="mx-auto w-full max-w-[1440px] px-5 py-16 lg:px-[30px] lg:py-24">
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {SOLUTIONS.map((solution, index) => (
            <li key={solution.slug}>
              <Link
                href={`/solutions/${solution.slug}`}
                className="group flex h-full flex-col gap-4 rounded-lg border border-ink/10 p-8 transition-colors hover:border-ink/25 hover:bg-mint"
              >
                <span className="font-mono text-[11px] tracking-[0.13em] text-ink/50 uppercase">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex items-start justify-between gap-4 text-3xl leading-none font-bold tracking-[-0.042em]">
                  {solution.title}
                  <span
                    aria-hidden
                    className="text-2xl text-ink/40 transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
                <span className="text-lg leading-[1.35] text-ink/70">
                  {solution.subtitle}
                </span>
                <span className="mt-auto flex flex-wrap gap-2 pt-2">
                  {solution.items.map((item) => (
                    <span
                      key={item.title}
                      className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs text-ink/70"
                    >
                      {item.title}
                    </span>
                  ))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
