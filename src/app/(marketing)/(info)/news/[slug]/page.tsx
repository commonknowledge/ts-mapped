import Image from "next/image";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import RichTextComponent from "@/components/RichTextComponent";
import { TypographyH1, TypographyP } from "@/components/typography";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";

const newsQuery = `*[_type == "news" && slug.current == $slug][0]`;
const options = { next: { revalidate: 30 } };

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
    <Container>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <TypographyH1>{news.title}</TypographyH1>
          <TypographyP className="text-sm text-neutral-500">
            {formatDate(news.publishedAt)}
          </TypographyP>
        </div>

        <div className="relative max-w-4xl border border-neutral-200 rounded-md overflow-hidden shadow-md">
          {news.image ? (
            <Image
              src={urlFor(news.image).url()}
              alt={news.title}
              width={1000}
              height={1000}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <Image
              src={"/screenshot-placeholder.jpeg"}
              alt={news.title}
              width={1000}
              height={1000}
              className="w-full h-full object-cover object-top"
            />
          )}
        </div>
        <div className="max-w-4xl">
          <RichTextComponent content={news.content} />
        </div>
      </div>
    </Container>
  );
}
