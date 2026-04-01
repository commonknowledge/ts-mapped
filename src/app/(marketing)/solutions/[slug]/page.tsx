import Image from "next/image";
import React from "react";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import { Link } from "@/components/Link";
import {
  TypographyH1,
  TypographyH2,
  TypographyLead,
  TypographyMuted,
  TypographyP,
} from "@/components/typography";
import { Badge } from "@/shadcn/ui/badge";
import { Button } from "@/shadcn/ui/button";
import { solutions } from "../../../../../solutions-content/manifest";
import type { SolutionItem } from "../../../../../solutions-content/manifest";

export default async function SolutionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const solution = solutions.find((s) => s.slug === slug);

  if (!solution) {
    notFound();
  }

  return (
    <>
      {/* Hero */}
      <div className="bg-brand-background relative overflow-hidden py-10 md:py-20">
        <Container>
          <div className="relative z-10 / flex flex-col gap-6">
            <TypographyMuted className="mb-2 font-mono">
              Solutions
            </TypographyMuted>

            <div>
              <TypographyH1>{solution.title}</TypographyH1>
              {solution.subtitle && (
                <TypographyLead className="mt-2 max-w-2xl">
                  {solution.subtitle}
                </TypographyLead>
              )}
              {solution.status === "coming-soon" && (
                <TypographyP className="mt-10 text-neutral-600 text-sm flex items-center gap-2">
                  <Badge>Coming soon</Badge>
                  Bear with, we&apos;re working on it!
                </TypographyP>
              )}
            </div>
          </div>
        </Container>

        <div className="absolute -top-2 -right-2 md:w-auto w-1/2">
          <Image
            src="/pattern.svg"
            alt="Mapped"
            className=""
            height={600}
            width={300}
          />
        </div>
      </div>

      {/* Content */}
      <Container className="py-10 md:py-20">
        {solution.items && solution.items.length > 0 ? (
          solution.items.map((item, index) => (
            <SolutionItemCard
              key={item.title}
              solutionItem={item}
              isReversed={index % 2 === 1}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <TypographyH2>No solutions available</TypographyH2>
            <TypographyP className="mt-2 text-neutral-600">
              This solution page doesn&apos;t have any content yet.
            </TypographyP>
          </div>
        )}
      </Container>
    </>
  );
}

function SolutionItemCard({
  solutionItem,
  isReversed,
}: {
  solutionItem: SolutionItem;
  isReversed: boolean;
}) {
  const buttonHref =
    solutionItem.button?.linkType === "docs"
      ? `/docs/${solutionItem.button.docsSlug}`
      : (solutionItem.button?.url ?? "#");

  const textContent = (
    <div className="col-span-1 space-y-4">
      <TypographyH2>{solutionItem.title}</TypographyH2>
      <div className="text-neutral-600">
        {solutionItem.description?.split("\n").map((paragraph, index) => (
          <TypographyP key={index} className="text-base">
            {paragraph}
          </TypographyP>
        ))}
      </div>
      {solutionItem.button && (
        <Button className="mt-4" variant="secondary">
          <Link href={buttonHref}>{solutionItem.button.text}</Link>
        </Button>
      )}
    </div>
  );

  const imageContent = (
    <div className="col-span-2">
      <Image
        src={solutionItem.image ?? "/screenshot-placeholder.jpeg"}
        alt={solutionItem.title}
        width={1400}
        height={1000}
        className="w-full h-full object-cover"
      />
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12 items-center">
      {/* Mobile: Always image first, then text */}
      <div className="md:hidden">
        {imageContent}
        {textContent}
      </div>

      {/* Desktop: Respect isReversed logic */}
      <div className="hidden md:contents">
        {isReversed ? (
          <>
            {imageContent}
            {textContent}
          </>
        ) : (
          <>
            {textContent}
            {imageContent}
          </>
        )}
      </div>
    </div>
  );
}
