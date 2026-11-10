import Image from "next/image";
import { notFound } from "next/navigation";
import { Link } from "@/components/Link";
import InlineText from "@/components/marketing/v3/InlineText";
import MarketingButton from "@/components/marketing/v3/MarketingButton";
import MarketingPageHero from "@/components/marketing/v3/MarketingPageHero";
import { SOLUTIONS } from "@/content/marketing/solutions";
import { getDocPage, getSolution } from "@/content/marketing/utils";
import { cn } from "@/shadcn/utils";
import type { Metadata } from "next";

export const dynamicParams = false;

export function generateStaticParams() {
  return SOLUTIONS.map((solution) => ({ slug: solution.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const solution = getSolution((await params).slug);
  return solution
    ? { title: `${solution.title} — Mapped`, description: solution.subtitle }
    : {};
}

export default async function SolutionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const solution = getSolution((await params).slug);
  if (!solution) notFound();
  const others = SOLUTIONS.filter((s) => s.slug !== solution.slug);

  return (
    <main>
      <MarketingPageHero
        eyebrow="Solutions"
        title={solution.title}
        description={solution.subtitle}
      >
        {solution.status === "coming-soon" && (
          <p className="mt-4 flex items-center gap-2 text-sm text-ink/70">
            <span className="rounded-full bg-ink px-2.5 py-1 font-mono text-[10px] tracking-[0.13em] text-white uppercase">
              Coming soon
            </span>
            Bear with, we&apos;re working on it!
          </p>
        )}
      </MarketingPageHero>

      <div className="mx-auto w-full max-w-[1440px] px-5 py-6 lg:px-[30px] lg:py-10">
        {solution.items.map((item, index) => {
          const doc = item.docSlug ? getDocPage(item.docSlug)?.page : null;
          return (
            <section
              key={item.title}
              className={cn(
                "grid grid-cols-1 items-center gap-8 border-b border-ink/10 py-12 last:border-0 md:gap-12 md:py-16",
                item.image && "md:grid-cols-2",
              )}
            >
              <div
                className={cn(
                  "flex max-w-xl flex-col gap-4",
                  item.image && index % 2 === 1 && "md:order-2",
                )}
              >
                <p className="font-mono text-[11px] tracking-[0.13em] text-ink/50 uppercase">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="text-3xl leading-none font-bold tracking-[-0.042em] text-balance md:text-4xl">
                  {item.title}
                </h2>
                {item.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-lg leading-[1.4] text-ink/70"
                  >
                    <InlineText text={paragraph} />
                  </p>
                ))}
                {doc && (
                  <MarketingButton
                    href={`/docs/${doc.slug}`}
                    variant="ink"
                    className="mt-2 w-fit"
                  >
                    {`Read the docs: ${doc.title}`}
                  </MarketingButton>
                )}
              </div>
              {item.image && (
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  width={item.image.width}
                  height={item.image.height}
                  className="h-auto w-full rounded border border-ink/10"
                />
              )}
            </section>
          );
        })}
      </div>

      <section className="border-t border-ink/10 bg-mint/50">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-14 lg:px-[30px]">
          <p className="mb-6 font-mono text-[11px] tracking-[0.13em] text-ink/50 uppercase">
            More solutions
          </p>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/solutions/${other.slug}`}
                  className="group flex h-full flex-col gap-2 rounded-lg border border-ink/10 bg-white p-6 transition-colors hover:border-ink/25"
                >
                  <span className="flex items-center justify-between gap-2 text-xl font-bold tracking-[-0.032em]">
                    {other.title}
                    <span
                      aria-hidden
                      className="text-ink/40 transition-transform group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </span>
                  <span className="text-sm leading-snug text-ink/60">
                    {other.summary}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
