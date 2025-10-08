import Image from "next/image";
import { type SanityDocument } from "next-sanity";
import React from "react";
import Container from "@/components/layout/Container";
import { Link } from "@/components/Link";
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
    linkType: string;
    docsPage?: {
      slug: {
        current: string;
      };
    };
  };
}

const POST_QUERY = `*[_type == "solutions" && slug.current == $slug][0]{
  title,
  subtitle,
  slug,
  position,
  publishedAt,
  solutionsArray[]{
    title,
    description,
    image,
    button{
      text,
      linkType,
      url,
      docsPage->{
        slug
      }
    }
  }
}`;
const options = { next: { revalidate: 30 } };

export default async function SolutionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const solution = await client.fetch<SanityDocument>(
    POST_QUERY,
    await params,
    options,
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
    <>
      {/* Hero */}
      <div className="bg-brand-background relative overflow-hidden py-10 md:py-20">
        <Container>
          <div className="relative z-10 / flex flex-col gap-6">
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
        {solution.solutionsArray && solution.solutionsArray.length > 0 ? (
          solution.solutionsArray.map(
            (solution: SolutionArray, index: number) => (
              <SolutionItemCard
                key={solution.title}
                solutionItem={solution}
                isReversed={index % 2 === 1}
              />
            ),
          )
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
          <Link
            href={
              solutionItem.button.linkType === "docs"
                ? `/docs/${solutionItem.button.docsPage?.slug?.current}`
                : solutionItem.button.url
            }
          >
            {solutionItem.button.text}
          </Link>
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
          className="w-full h-full object-cover rounded-md border border-neutral-200 shadow-md"
        />
      ) : (
        <Image
          src={"/screenshot-placeholder.jpeg"}
          alt={solutionItem.title}
          width={1400}
          height={1000}
          className="w-full h-full object-cover rounded-md border border-neutral-200 shadow-md"
        />
      )}
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
