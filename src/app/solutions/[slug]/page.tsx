import Image from "next/image";
import Link from "next/link";
import { type SanityDocument } from "next-sanity";
import React from "react";

import {
  TypographyH1,
  TypographyH2,
  TypographyLead,
  TypographyMuted,
  TypographyP,
} from "@/components/typography";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { Button } from "@/shadcn/ui/button";

interface SolutionArray {
  title: string;
  description: string;
  image?: string;
  button?: {
    text: string;
    url: string;
  };
}

const POST_QUERY = `*[_type == "solutions" && slug.current == $slug][0]`;
const options = { next: { revalidate: 30 } };

export default async function SolutionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const solution = await client.fetch<SanityDocument>(
    POST_QUERY,
    await params,
    options
  );

  if (!solution) {
    return (
      <div className="container mx-auto px-4 py-8">
        <TypographyH1>Solution Not Found</TypographyH1>
        <TypographyP>
          The solution you&apos;re looking for doesn&apos;t exist.
        </TypographyP>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col p-6 gap-6 justify-between bg-brand-background relative overflow-hidden">
        {/* Breadcrumb */}
        <TypographyMuted className="mb-2 font-mono">
          — Solutions
        </TypographyMuted>

        <div>
          <TypographyH1>{solution.title}</TypographyH1>
          {solution.subtitle && (
            <TypographyLead className="mt-2 max-w-2xl">
              {solution.subtitle}
            </TypographyLead>
          )}
        </div>
        <div className="absolute -top-2 -right-2">
          <Image
            src="/pattern.svg"
            alt="Mapped"
            className=""
            height={600}
            width={300}
          />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Content */}
        {solution.solutionsArray.map(
          (solution: SolutionArray, index: number) => (
            <SolutionItemCard
              key={solution.title}
              solutionItem={solution}
              isReversed={index % 2 === 1}
            />
          )
        )}
      </div>
    </div>
  );
}

function SolutionItemCard({
  solutionItem,
  isReversed,
}: {
  solutionItem: SolutionArray;
  isReversed: boolean;
}) {
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
          <Link href={solutionItem.button.url}>{solutionItem.button.text}</Link>
        </Button>
      )}
    </div>
  );

  const imageContent = (
    <div className="col-span-2">
      {solutionItem.image ? (
        <Image
          src={urlFor(solutionItem.image).url()}
          alt={solutionItem.title}
          width={1400}
          height={1000}
          className="w-full h-full object-cover"
        />
      ) : (
        <Image
          src={"/screenshot.png"}
          alt={solutionItem.title}
          width={1400}
          height={1000}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-4 py-12 items-center">
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
  );
}
