import Image from "next/image";
import React from "react";
import Container from "@/components/layout/Container";
import { Link } from "@/components/Link";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { Button } from "@/shadcn/ui/button";
import {
    TypographyH2,
    TypographyP,
} from "@/components/typography";

const HOMEPAGE_SOLUTIONS_QUERY = `*[_type == "solutions" && status != "archived"] | order(position asc) [0...6] {
  _id,
  title,
  subtitle,
  slug,
  icon
}`;

interface Solution {
    _id: string;
    title: string;
    subtitle: string;
    slug: { current: string };
    icon?: string;
}

const options = { next: { revalidate: 30 } };

// Generate slug-friendly IDs for anchor links (same as solutions page)
const getSolutionId = (slug: string) => {
    return slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
};

export default async function HomepageSolutionsSection() {
    const solutions = await client.fetch<Solution[]>(
        HOMEPAGE_SOLUTIONS_QUERY,
        {},
        options,
    );

    if (!solutions || solutions.length === 0) {
        return null;
    }

    return (
        <Container>
            <div className="py-10 md:py-20">
                <div className="mb-12">
                    <TypographyH2>Solutions</TypographyH2>
                    <TypographyP className="mt-2 text-neutral-600">
                        Discover our comprehensive solutions designed to enhance your organising strategy.
                    </TypographyP>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {solutions.map((solution) => {
                        const solutionId = getSolutionId(
                            solution.slug?.current || solution.title,
                        );
                        return (
                            <Link
                                key={solution._id}
                                href={`/solutions#${solutionId}`}
                                className="group border border-neutral-200 rounded-lg overflow-hidden hover:border-neutral-300 hover:shadow-md transition-all block no-underline cursor-pointer"
                            >
                                {solution.icon && (
                                    <div className="aspect-video w-full overflow-hidden bg-neutral-50 flex items-center justify-center p-8">
                                        <Image
                                            src={urlFor(solution.icon).url()}
                                            alt={solution.title}
                                            className="w-16 h-16 object-contain group-hover:scale-110 transition-transform duration-300"
                                            width={64}
                                            height={64}
                                        />
                                    </div>
                                )}
                                <div className="p-6">
                                    <TypographyH2 className="text-xl mb-2 text-neutral-900 group-hover:text-brand-primary transition-colors">
                                        {solution.title}
                                    </TypographyH2>
                                    <TypographyP className="text-neutral-600 text-sm">
                                        {solution.subtitle}
                                    </TypographyP>
                                </div>
                            </Link>
                        );
                    })}
                </div>
                <div className="flex justify-center">
                    <Button variant="secondary" asChild>
                        <Link href="/solutions">
                            View solutions
                        </Link>
                    </Button>
                </div>
            </div>
        </Container>
    );
}

