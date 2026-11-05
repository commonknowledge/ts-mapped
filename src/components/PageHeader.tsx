import Image from "next/image";
import React from "react";
import { cn } from "@/shadcn/utils";

/**
 * A dashboard page's heading: an optional mono eyebrow, the title and a
 * line on what the page is for, with the page's main action on the right.
 * "hero" sets it in the marketing site's pale green band, for the pages
 * people land on.
 */
export default function PageHeader({
  title,
  eyebrow,
  description,
  action,
  variant = "plain",
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "plain" | "hero";
}) {
  const isHero = variant === "hero";
  return (
    <header
      className={cn(
        "relative mb-8 flex w-full items-end justify-between gap-6",
        isHero
          ? "overflow-hidden rounded-2xl bg-mint px-8 py-8"
          : "border-b border-neutral-200 pb-6",
      )}
    >
      {isHero && (
        // The marketing site's line pattern, faint in the corner
        <Image
          src="/marketing-v3/pattern-hero.svg"
          alt=""
          aria-hidden
          width={468}
          height={467}
          className="pointer-events-none absolute -top-24 -right-16 w-80 max-w-none opacity-40"
        />
      )}
      <div className="relative min-w-0">
        {eyebrow && (
          <p className="mb-2 font-mono text-[11px] tracking-[0.13em] text-neutral-500 uppercase">
            {eyebrow}
          </p>
        )}
        <h1
          className={cn(
            "leading-tight font-semibold tracking-[-0.02em] text-ink",
            isHero ? "text-3xl" : "text-2xl",
          )}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
            {description}
          </p>
        )}
      </div>
      {action && <div className="relative shrink-0">{action}</div>}
    </header>
  );
}
