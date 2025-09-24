import { PortableText } from "next-sanity";
import React from "react";
import Prose from "@/components/Prose";
import type { RichTextBlock } from "@/app/(marketing)/types";

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

  return (
    <Prose className={className}>
      <PortableText value={content} />
    </Prose>
  );
}
