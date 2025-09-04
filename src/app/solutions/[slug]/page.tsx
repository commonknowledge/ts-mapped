import React from 'react'
import { useParams } from 'next/navigation'
import { type SanityDocument } from "next-sanity";
import Image from 'next/image';

import { client } from "@/sanity/lib/client";
import { urlFor } from '@/sanity/lib/image';
import {
  TypographyH1,
  TypographyH2,
  TypographyP,
  TypographyLead,
  TypographyMuted,
  TypographyBlockquote,
  TypographyList
} from '@/components/typography';

const POST_QUERY = `*[_type == "solutions" && slug.current == $slug][0]`;
const { projectId, dataset } = client.config();
const options = { next: { revalidate: 30 } };

export default async function SolutionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const solution = await client.fetch<SanityDocument>(POST_QUERY, await params, options);

  if (!solution) {
    return (
      <div className="container mx-auto px-4 py-8">
        <TypographyH1>Solution Not Found</TypographyH1>
        <TypographyP>The solution you're looking for doesn't exist.</TypographyP>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 p-6 md:grid-cols-2 gap-4">
        <div >
          {/* Breadcrumb */}
          <TypographyMuted className="mb-2 font-mono">
            — Solutions
          </TypographyMuted>

          {/* Header */}

          <TypographyH1>{solution.title}</TypographyH1>


        </div>
        {solution.subtitle && (
          <TypographyLead className="mt-4 max-w-2xl">
            {solution.subtitle}
          </TypographyLead>
        )}
      </div>
      <div>
        <div className="w-full h-full mx-auto max-w-5xl p-6">

          {solution.image && (

            <Image
              src={urlFor(solution.image).url()}
              alt={solution.title}
              width={2000}
              height={1000}
              className="w-full h-full object-cover rounded-lg shadow-lg border border-neutral-200" />
          )}
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          {solution.body && (
            <div className="space-y-6">
              {/* Render the body content - you'll need to implement a portable text renderer */}
              <TypographyP>
                {solution.body}
              </TypographyP>
            </div>
          )}
        </div>

        {/* Metadata */}
        {
          solution.publishedAt && (
            <div className="mt-8 pt-6 border-t">
              <TypographyMuted>
                Published on {new Date(solution.publishedAt).toLocaleDateString()}
              </TypographyMuted>
            </div>
          )
        }
      </div >
    </div >
  )
}



