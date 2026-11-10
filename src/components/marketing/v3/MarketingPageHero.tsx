import Image from "next/image";
import type { ReactNode } from "react";

/**
 * A marketing page's opening band, in the homepage hero's pale green with
 * its boundary pattern: a mono eyebrow, the title and a line under it
 */
export default function MarketingPageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-mint">
      <Image
        src="/marketing-v3/pattern-hero.svg"
        alt=""
        aria-hidden
        width={468}
        height={467}
        className="pointer-events-none absolute -top-10 -right-[20px] w-48 max-w-none opacity-60 md:w-[340px] md:opacity-100"
      />
      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-4 px-5 pt-12 pb-14 lg:px-[30px] lg:pt-20 lg:pb-20">
        {eyebrow && (
          <p className="font-mono text-[11px] leading-[1.08] tracking-[0.13em] uppercase opacity-50 lg:text-xs">
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-4xl text-4xl leading-[0.98] font-bold tracking-[-0.052em] text-balance text-ink md:text-6xl">
          {title}
        </h1>
        {description && (
          <div className="max-w-2xl text-lg leading-[1.35] text-ink/70">
            {description}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
