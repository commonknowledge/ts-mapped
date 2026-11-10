import MarketingPageHero from "@/components/marketing/v3/MarketingPageHero";
import { client } from "@/sanity/lib/client";
import RichTextComponent from "../../components/RichTextComponent";

const aboutQuery = `*[_type == "about"][0]`;

export default async function AboutPage() {
  const about = await client.fetch(aboutQuery);
  return (
    <>
      <MarketingPageHero
        eyebrow="About"
        title={about.title}
        description="Made for the movement, by the movement"
      />
      <div className="mx-auto w-full max-w-[1440px] px-5 py-16 lg:px-[30px] lg:py-24">
        <RichTextComponent
          content={about.body}
          className="prose-lg max-w-3xl"
        />
      </div>
    </>
  );
}
