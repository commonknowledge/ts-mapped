import Image from "next/image";
import { Link } from "@/components/Link";
import Prose from "@/components/Prose";
import { client } from "@/sanity/lib/client";
import RichTextComponent from "../../components/RichTextComponent";

const aboutQuery = `*[_type == "about"][0]`;

export default async function AboutPage() {
  const about = await client.fetch(aboutQuery);
  return (
    <Prose className="mx-auto">
      <h1>{about.title}</h1>
      <RichTextComponent content={about.body} />
    </Prose>
  );
}
