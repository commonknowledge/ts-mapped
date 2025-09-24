import Image from "next/image";
import { PortableText } from "next-sanity";
import React from "react";
import Prose from "@/components/Prose";
import { urlFor } from "@/sanity/lib/image";
import type { RichTextBlock } from "@/app/(marketing)/(info)/types";
import type { PortableTextComponents } from "next-sanity";

export default function RichTextComponent({
  content,
  className = "",
}: {
  content: RichTextBlock[];
  className?: string;
}) {
  console.log(content);

  if (!content || !Array.isArray(content)) {
    return null;
  }
  const components: PortableTextComponents = {
    types: {
      image: ({ value }) => <RichTextImage value={value} />,
    },
  };

  return (
    <Prose className={className}>
      <PortableText value={content} components={components} />
    </Prose>
  );
}

// components

interface SanityImage {
  _type: "image";
  asset: {
    _ref: string;
    _type: "reference";
  };
  alt?: string;
  caption?: string;
}

function RichTextImage({ value }: { value: SanityImage }) {
  const url = urlFor(value).url();

  if (!url) {
    return <></>;
  }

  return (
    <figure>
      <Image src={url} alt={value.alt || ""} width={800} height={500} />
      {value.caption ? <figcaption>{value.caption} </figcaption> : <></>}
    </figure>
  );
}
