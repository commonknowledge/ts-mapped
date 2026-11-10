import Image from "next/image";
import { Link } from "@/components/Link";
import MarketingPageHero from "@/components/marketing/v3/MarketingPageHero";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import type { NewsItem } from "../../types";
import type { Metadata } from "next";

const newsQuery = `*[_type == "news"] | order(publishedAt desc) {
  _id,
  title,
  slug {
    current
  },
  publishedAt,
  image,
}`;

// TODO: remove or update when you bring back news pages
export const metadata: Metadata = {
  title: "",
  description: "",
  robots: {
    index: false,
    follow: false,
  },
};

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
    <>
      <MarketingPageHero
        eyebrow="News"
        title="News"
        description="What we've been building, and who with"
      />
      <div className="mx-auto w-full max-w-[1440px] px-5 py-16 lg:px-[30px] lg:py-24">
        <ul className="grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
          {news.map((newsItem: NewsItem) => (
            <li key={newsItem._id}>
              <Link
                href={`/news/${newsItem.slug.current}`}
                className="group flex flex-col gap-5"
              >
                <Image
                  src={
                    newsItem.image
                      ? urlFor(newsItem.image).url()
                      : "/screenshot-placeholder.jpeg"
                  }
                  alt=""
                  width={1000}
                  height={624}
                  className="aspect-[670/418] h-auto w-full object-cover object-top transition-opacity group-hover:opacity-90"
                />
                <span className="flex flex-col gap-2">
                  <span className="font-mono text-[11px] leading-[0.85] font-semibold tracking-[0.08em] text-[#678de3] uppercase">
                    {formatDate(newsItem.publishedAt)}
                  </span>
                  <span className="text-2xl leading-[1.05] font-bold tracking-[-0.042em] text-balance group-hover:underline">
                    {newsItem.title}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
