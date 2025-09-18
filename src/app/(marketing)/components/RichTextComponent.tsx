import { PortableText } from "next-sanity";
import React from "react";
import Prose from "@/components/Prose";
import type { RichTextBlock } from "@/app/(marketing)/(info)/types";

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
    <div className={className}>
      <Prose>
        <PortableText value={content} />
      </Prose>
    </div>
  );
}

// Helper function to extract plain text from rich text blocks
export function getTextFromBlocks(blocks: RichTextBlock[]): string {
  if (!blocks || !Array.isArray(blocks)) return "";

  return blocks
    .map((block) => {
      if (block._type === "block" && block.children) {
        return block.children
          .map((child: { text: string }) => child.text || "")
          .join("");
      }
      return "";
    })
    .join(" ");
}
