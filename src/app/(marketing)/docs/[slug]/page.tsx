import Image from "next/image";
import { notFound } from "next/navigation";
import { Link } from "@/components/Link";
import InlineText from "@/components/marketing/v3/InlineText";
import {
  getAllDocPages,
  getDocNeighbours,
  getDocPage,
} from "@/content/marketing/utils";
import type { Metadata } from "next";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllDocPages().map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const found = getDocPage((await params).slug);
  return found
    ? {
        title: `${found.page.title} — Mapped docs`,
        description: found.page.subtitle,
      }
    : {};
}

const sectionId = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = getDocPage(slug);
  if (!found) notFound();
  const { page, group } = found;
  const { previous, next } = getDocNeighbours(slug);
  const related = (page.related ?? [])
    .map((s) => getDocPage(s)?.page)
    .filter((p) => p !== undefined);

  return (
    <div className="flex gap-12">
      <article className="flex max-w-3xl min-w-0 flex-1 flex-col gap-10">
        <header className="flex flex-col gap-4">
          <p className="font-mono text-[11px] tracking-[0.13em] text-ink/50 uppercase">
            <Link href="/docs" className="hover:text-ink">
              Docs
            </Link>
            {" / "}
            {group.title}
          </p>
          <h1 className="text-4xl leading-[0.98] font-bold tracking-[-0.052em] text-balance md:text-5xl">
            {page.title}
          </h1>
          <p className="text-xl leading-[1.35] text-ink/70">{page.subtitle}</p>
        </header>

        {page.intro?.map((paragraph) => (
          <p key={paragraph} className="text-lg leading-relaxed text-ink/80">
            <InlineText text={paragraph} />
          </p>
        ))}

        {page.sections.map((section) => (
          <section
            key={section.title}
            id={sectionId(section.title)}
            className="flex scroll-mt-8 flex-col gap-4 border-t border-ink/10 pt-8"
          >
            <h2 className="text-2xl leading-none font-bold tracking-[-0.042em]">
              {section.title}
            </h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="leading-relaxed text-ink/80">
                <InlineText text={paragraph} />
              </p>
            ))}
            {section.steps && (
              <ol className="flex flex-col gap-5">
                {section.steps.map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-mint font-mono text-xs text-ink">
                      {index + 1}
                    </span>
                    <div className="flex flex-col gap-1 pt-0.5">
                      <p className="font-bold tracking-[-0.02em]">
                        {step.title}
                      </p>
                      {step.body && (
                        <p className="text-sm leading-relaxed text-ink/70">
                          <InlineText text={step.body} />
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {section.image && (
              <figure className="flex flex-col gap-2">
                <Image
                  src={section.image.src}
                  alt={section.image.alt}
                  width={section.image.width}
                  height={section.image.height}
                  className="h-auto w-full rounded border border-ink/10"
                />
                {section.image.caption && (
                  <figcaption className="text-sm text-ink/60">
                    {section.image.caption}
                  </figcaption>
                )}
              </figure>
            )}
          </section>
        ))}

        {related.length > 0 && (
          <section className="flex flex-col gap-3 border-t border-ink/10 pt-8">
            <p className="font-mono text-[11px] tracking-[0.13em] text-ink/50 uppercase">
              Read next
            </p>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {related.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/docs/${p.slug}`}
                    className="flex h-full flex-col gap-1 rounded-lg border border-ink/10 p-4 transition-colors hover:border-ink/25 hover:bg-mint"
                  >
                    <span className="font-bold tracking-[-0.02em]">
                      {p.title}
                    </span>
                    <span className="text-sm leading-snug text-ink/60">
                      {p.subtitle}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <nav
          aria-label="Previous and next"
          className="flex justify-between gap-4 border-t border-ink/10 pt-6 text-sm"
        >
          {previous ? (
            <Link href={`/docs/${previous.slug}`} className="hover:underline">
              ← {previous.title}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`/docs/${next.slug}`} className="hover:underline">
              {next.title} →
            </Link>
          )}
        </nav>
      </article>

      {page.sections.length > 2 && (
        <aside className="hidden w-56 shrink-0 xl:block">
          <div className="sticky top-8">
            <p className="mb-3 font-mono text-[11px] tracking-[0.13em] text-ink/50 uppercase">
              On this page
            </p>
            <ul className="space-y-2 text-sm">
              {page.sections.map((section) => (
                <li key={section.title}>
                  <a
                    href={`#${sectionId(section.title)}`}
                    className="text-ink/60 hover:text-ink"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </div>
  );
}
