import Image from "next/image";
import { PortableText } from "next-sanity";
import React from "react";
import Prose from "@/components/Prose";
import { urlFor } from "@/sanity/lib/image";
import type { RichTextBlock } from "@/app/(marketing)/types";
import type { PortableTextComponents } from "next-sanity";

export default function RichTextComponent({
  content,
  className = "",
}: {
  content: RichTextBlock[];
  className?: string;
}) {
  if (!content || !Array.isArray(content)) {
    return null;
  }

  const components: PortableTextComponents = {
    types: {
      image: ({ value }) => <RichTextImage value={value} />,
      youtube: ({ value }) => <RichTextYoutubeEmbed value={value} />,
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
  isScreenshot?: boolean;
  size?: "sm" | "md" | "lg";
  link?: {
    href: string;
    openInNewTab?: boolean;
  };
}

function RichTextImage({ value }: { value: SanityImage }) {
  const url = urlFor(value).url();

  if (!url) {
    return <></>;
  }

  // Size classes for different image sizes
  const sizeClasses = {
    sm: "max-w-48",
    md: "max-w-96",
    lg: "max-w-2xl",
  };

  // Screenshot styling (current styling)
  const screenshotClasses = "border rounded-md border-neutral-200 shadow-md";

  // Regular image styling (no border/shadow)
  const regularClasses = "";

  // Determine which classes to use
  const imageClasses = value.isScreenshot ? screenshotClasses : regularClasses;

  const sizeClass = value.size ? sizeClasses[value.size] : sizeClasses.md;

  const imageElement = (
    <Image
      src={url}
      alt={value.alt || ""}
      width={624}
      height={624}
      className={imageClasses}
    />
  );

  const content = value.link ? (
    <a
      href={value.link.href}
      target={value.link.openInNewTab ? "_blank" : undefined}
      rel={value.link.openInNewTab ? "noopener noreferrer" : undefined}
      className="block"
    >
      {imageElement}
    </a>
  ) : (
    imageElement
  );

  return (
    <figure className={value.isScreenshot ? "" : sizeClass}>
      {content}
      {value.caption ? <figcaption>{value.caption} </figcaption> : <></>}
    </figure>
  );
}

interface YouTubeEmbed {
  _type: "youtube";
  src: string;
}

function RichTextYoutubeEmbed({ value }: { value: YouTubeEmbed }) {
  const src = value.src;

  if (!src) {
    return <></>;
  }

  return (
    <figure>
      <div className="relative h-0 pb-[56.25%]">
        <iframe
          src={src}
          className="absolute top-0 left-0 w-full !h-full block"
        ></iframe>
      </div>
    </figure>
  );
}
