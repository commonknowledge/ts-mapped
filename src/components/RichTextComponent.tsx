import { PortableText } from "next-sanity";
import React from "react";
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyP,
} from "@/components/typography";
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
    <div className={`space-y-4 ${className}`}>
      <PortableText
        value={content}
        components={{
          block: {
            h1: ({ children }) => (
              <TypographyH1 className="mt-6 mb-4">{children}</TypographyH1>
            ),
            h2: ({ children }) => (
              <TypographyH2 className="mt-6 mb-4">{children}</TypographyH2>
            ),
            h3: ({ children }) => (
              <TypographyH3 className="mt-4 mb-2">{children}</TypographyH3>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-brand-primary pl-4 italic text-neutral-600">
                {children}
              </blockquote>
            ),
            normal: ({ children }) => (
              <TypographyP className="text-neutral-700 leading-relaxed">
                {children}
              </TypographyP>
            ),
          },
          marks: {
            strong: ({ children }) => <strong>{children}</strong>,
            em: ({ children }) => <em>{children}</em>,
            code: ({ children }) => (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            ),
            link: ({ children, value }) => (
              <a
                href={value?.href}
                className="text-brand-primary hover:text-brand-primary/80 underline"
                target={value?.href?.startsWith("http") ? "_blank" : undefined}
                rel={
                  value?.href?.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
              >
                {children}
              </a>
            ),
          },
          list: {
            bullet: ({ children }) => (
              <ul className="list-disc list-inside space-y-2 ml-4">
                {children}
              </ul>
            ),
            number: ({ children }) => (
              <ol className="list-decimal list-inside space-y-2 ml-4">
                {children}
              </ol>
            ),
          },
          listItem: {
            bullet: ({ children }) => <li>{children}</li>,
            number: ({ children }) => <li>{children}</li>,
          },
        }}
      />
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
