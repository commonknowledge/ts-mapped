import Image from "next/image";
import { notFound } from "next/navigation";
import RichTextComponent from "@/app/(marketing)/components/RichTextComponent";
import MarketingPageHero from "@/components/marketing/v3/MarketingPageHero";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import type { Metadata } from "next";

const newsQuery = `*[_type == "news" && slug.current == $slug][0]`;
const options = { next: { revalidate: 30 } };

// TODO: remove or update when you bring back news pages
export const metadata: Metadata = {
  title: "",
  description: "",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function NewsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const news = await client.fetch(newsQuery, { slug }, options);
  if (!news) {
    return notFound();
  }
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
        eyebrow={formatDate(news.publishedAt)}
        title={news.title}
      />
      <article className="mx-auto flex w-full max-w-[1440px] flex-col gap-12 px-5 py-16 lg:px-[30px] lg:py-24">
        <Image
          src={
            news.image
              ? urlFor(news.image).url()
              : "/screenshot-placeholder.jpeg"
          }
          alt=""
          width={1600}
          height={1000}
          className="h-auto w-full max-w-4xl object-cover object-top"
        />
        <RichTextComponent content={news.body} className="prose-lg max-w-3xl" />
      </article>
    </>
  );
}
