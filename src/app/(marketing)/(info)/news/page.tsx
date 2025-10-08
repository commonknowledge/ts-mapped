import Image from "next/image";
import Container from "@/components/layout/Container";
import { Link } from "@/components/Link";
import {
  TypographyH1,
  TypographyH3,
  TypographyP,
} from "@/components/typography";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import type { NewsItem } from "../../types";
const newsQuery = `*[_type == "news"] | order(publishedAt desc) {
  _id,
  title,
  slug {
    current
  },
  publishedAt,
  image,
}`;

export default async function NewsPage() {
  const news = await client.fetch(newsQuery);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
  return (
    <Container>
      <TypographyH1 className="mb-2">News</TypographyH1>
      <TypographyP className="mb-8">
        Latest news and updates from Mapped
      </TypographyP>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {news.map((newsItem: NewsItem) => (
          <Link
            href={`/news/${newsItem.slug.current}`}
            key={newsItem._id}
            className="border border-neutral-200 rounded-md overflow-hidden shadow-md hover:bg-neutral-50 transition-all duration-300"
          >
            <div className="relative w-full h-48 border-b border-neutral-200">
              {newsItem.image ? (
                <Image
                  src={urlFor(newsItem.image).url()}
                  alt={newsItem.title}
                  width={1000}
                  height={1000}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <Image
                  src={"/screenshot-placeholder.jpeg"}
                  alt={newsItem.title}
                  width={1000}
                  height={1000}
                  className="w-full h-full object-cover object-top"
                />
              )}
            </div>
            <div className="p-4">
              <TypographyH3>{newsItem.title}</TypographyH3>
              <TypographyP className="text-sm text-neutral-500">
                {formatDate(newsItem.publishedAt)}
              </TypographyP>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
