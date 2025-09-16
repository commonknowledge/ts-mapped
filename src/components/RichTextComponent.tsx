import React from "react";
import {
  TypographyH2,
  TypographyH3,
  TypographyP,
} from "@/components/typography";
import type { RichTextBlock } from "@/app/docs/types";

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

  const renderBlock = (block: RichTextBlock, index: number) => {
    if (block._type !== "block" || !block.children) {
      return null;
    }

    // Extract text from children
    const text = block.children
      .map((child: { text: string }) => child.text || "")
      .join("");

    // Handle different styles
    switch (block.style) {
      case "h2":
        return (
          <TypographyH2 key={index} className="mt-6 mb-4">
            {text}
          </TypographyH2>
        );

      case "h3":
        return (
          <TypographyH3 key={index} className="mt-4 mb-2">
            {text}
          </TypographyH3>
        );

      case "blockquote":
        return (
          <blockquote
            key={index}
            className="border-l-4 border-brand-primary pl-4 italic text-neutral-600"
          >
            {text}
          </blockquote>
        );

      default:
        return (
          <TypographyP key={index} className="text-neutral-700 leading-relaxed">
            {text}
          </TypographyP>
        );
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {content.map((block, index) => renderBlock(block, index))}
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
